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
type session struct {
	who     string
	expires time.Time
}

type sessions struct {
	mu   sync.RWMutex
	live map[string]session
}

func newSessions() *sessions { return &sessions{live: map[string]session{}} }

// parseKeys разбирает список именованных ключей вида «Имя:ключ,Имя:ключ».
//
// Имя нужно не для красоты: один ключ на всех отвечает на вопрос «пустили ли»,
// но не на «кто вошёл», а второй вопрос и есть тот, ради которого заводят
// доступ. Имя ложится в сессию и дальше сможет попасть в журнал действий.
func parseKeys(raw string) map[string]string {
	out := map[string]string{}
	for _, pair := range strings.Split(raw, ",") {
		pair = strings.TrimSpace(pair)
		if pair == "" {
			continue
		}
		// Разделитель ищем справа: имя может содержать двоеточие, ключ — нет,
		// потому что мы его сами и порождаем.
		i := strings.LastIndex(pair, ":")
		if i <= 0 || i == len(pair)-1 {
			continue
		}
		out[strings.TrimSpace(pair[i+1:])] = strings.TrimSpace(pair[:i])
	}
	return out
}

func (s *sessions) issue(who string, ttl time.Duration) string {
	raw := make([]byte, 32)
	_, _ = rand.Read(raw)
	tok := base64.RawURLEncoding.EncodeToString(raw)

	sum := sha256.Sum256([]byte(tok))
	s.mu.Lock()
	defer s.mu.Unlock()
	// Попутно чистим истёкшие: отдельная задача по расписанию ради карты в
	// десяток строк избыточна, а без уборки она растёт вечно.
	now := time.Now()
	for k, v := range s.live {
		if v.expires.Before(now) {
			delete(s.live, k)
		}
	}
	s.live[hex.EncodeToString(sum[:])] = session{who: who, expires: now.Add(ttl)}
	return tok
}

// who возвращает имя вошедшего и признак живой сессии.
func (s *sessions) who(tok string) (string, bool) {
	if tok == "" {
		return "", false
	}
	sum := sha256.Sum256([]byte(tok))
	s.mu.RLock()
	v, ok := s.live[hex.EncodeToString(sum[:])]
	s.mu.RUnlock()
	if !ok || v.expires.Before(time.Now()) {
		return "", false
	}
	return v.who, true
}

func (s *sessions) valid(tok string) bool {
	_, ok := s.who(tok)
	return ok
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

func handleSignIn(s *sessions, keys map[string]string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Key string `json:"key"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeErr(w, http.StatusBadRequest, "неразобранное тело запроса")
			return
		}
		// Перебираем все ключи целиком, не прерываясь на совпавшем: выход по
		// первому попаданию выдал бы по времени ответа, сколько ключей
		// проверено до него. Сравнение тоже постоянного времени — обычное
		// прекращается на первом несовпавшем знаке, и ключ подбирается
		// посимвольно.
		given := strings.TrimSpace(body.Key)
		matched := ""
		for k, name := range keys {
			if subtle.ConstantTimeCompare([]byte(given), []byte(k)) == 1 {
				matched = name
			}
		}
		if matched == "" {
			writeErr(w, http.StatusUnauthorized, "ключ не подошёл")
			return
		}

		tok := s.issue(matched, 24*time.Hour)
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
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "who": matched})
	}
}
