package main

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// Вход по ключу пространства.
//
// Учётных записей нет намеренно: пространство принадлежит одному человеку, и
// заводить ему логин с почтой — лишний обряд. Ключ выдаёт владелец, служба
// сверяет и выдаёт сессию.
//
// Сессии в памяти: их единицы, живут сутки, и заводить ради них таблицу —
// больше кода, чем пользы. Перезапуск службы разлогинивает, и это честная
// цена: перезапуск здесь редкое событие, а не рабочий режим.
type sessions struct {
	mu   sync.RWMutex
	live map[string]time.Time
}

func newSessions() *sessions { return &sessions{live: map[string]time.Time{}} }

func (s *sessions) issue(ttl time.Duration) string {
	raw := make([]byte, 32)
	_, _ = rand.Read(raw)
	tok := base64.RawURLEncoding.EncodeToString(raw)

	sum := sha256.Sum256([]byte(tok))
	s.mu.Lock()
	defer s.mu.Unlock()
	// Попутно чистим истёкшие: отдельная задача по расписанию ради карты в
	// десяток строк избыточна, а без уборки она растёт вечно.
	now := time.Now()
	for k, exp := range s.live {
		if exp.Before(now) {
			delete(s.live, k)
		}
	}
	s.live[hex.EncodeToString(sum[:])] = now.Add(ttl)
	return tok
}

func (s *sessions) valid(tok string) bool {
	if tok == "" {
		return false
	}
	sum := sha256.Sum256([]byte(tok))
	s.mu.RLock()
	exp, ok := s.live[hex.EncodeToString(sum[:])]
	s.mu.RUnlock()
	return ok && exp.After(time.Now())
}

const sessionCookie = "cortex_session"

// requireSession закрывает всё, кроме входа и пробы.
//
// Ключ не задан — защиты нет вовсе, и служба об этом говорит на старте:
// молчаливо открытая наружу база хуже, чем открытая и названная.
func requireSession(s *sessions, keySet bool, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !keySet {
			next(w, r)
			return
		}
		c, err := r.Cookie(sessionCookie)
		if err != nil || !s.valid(c.Value) {
			writeErr(w, http.StatusUnauthorized, "нужен вход")
			return
		}
		next(w, r)
	}
}

func handleSignIn(s *sessions, key string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Key string `json:"key"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeErr(w, http.StatusBadRequest, "неразобранное тело запроса")
			return
		}
		// Сравнение постоянного времени: обычное прекращается на первом
		// несовпавшем знаке, и по времени ответа ключ подбирается посимвольно.
		if subtle.ConstantTimeCompare([]byte(strings.TrimSpace(body.Key)), []byte(key)) != 1 {
			writeErr(w, http.StatusUnauthorized, "ключ не подошёл")
			return
		}

		tok := s.issue(24 * time.Hour)
		http.SetCookie(w, &http.Cookie{
			Name:  sessionCookie,
			Value: tok,
			Path:  "/",
			// HttpOnly: сессия не нужна коду страницы, а доступная ему —
			// это то, что уносит первая же чужая строчка на странице.
			HttpOnly: true,
			Secure:   os.Getenv("CORTEX_INSECURE_COOKIE") != "true",
			SameSite: http.SameSiteLaxMode,
			MaxAge:   int((24 * time.Hour).Seconds()),
		})
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}
