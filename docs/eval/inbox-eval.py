#!/usr/bin/env python3
"""Мини-эталон для выбора модели: 6 случаев, бьющих по слабым местам парсинга.
Гоняется через llama-server API — модель остаётся загруженной, поэтому быстро.
"""
import json, sys, time, urllib.request

API = "http://127.0.0.1:8080/v1/chat/completions"
KEY = open("/etc/llama-server.env").read().split("API_KEY=")[1].split("\n")[0].strip()

SYSTEM = """Ты — парсер заметок. Отвечай ТОЛЬКО валидным JSON.
Проекты пользователя:
1) id=aurora — "Лендинг Аврора", редизайн сайта
2) id=finmarket — "Мобильное приложение Финмаркет"
3) id=coffee — "Кофейня", офлайн-точка

Правила:
- Ссылки "первый"/"второй" указывают на проект по номеру в списке.
- Проект можно определить по смыслу (кофемашина -> coffee).
- due_rel: относительный срок ИЗ ТЕКСТА ("завтра", "в пятницу"). Если срока нет — пустая строка "".
- Дату не вычисляй.
- kind: meeting | task | decision"""

SCHEMA = {"type": "object", "properties": {"tasks": {"type": "array", "items": {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "enum": ["aurora", "finmarket", "coffee"]},
        "title": {"type": "string"},
        "kind": {"type": "string", "enum": ["meeting", "task", "decision"]},
        "due_rel": {"type": "string"}},
    "required": ["project_id", "title", "kind", "due_rel"],
    "additionalProperties": False}}},
    "required": ["tasks"], "additionalProperties": False}

CASES = [
    dict(id="1.базовый", text="В среду созвон по редизайну лендинга для первого проекта, а для второго нужно найти подрядчика по анимации",
         want_projects=["aurora", "finmarket"], want_n=2,
         note="ссылки по номеру"),
    dict(id="2.без_срока", text="Надо подумать над новой айдентикой для кофейни",
         want_projects=["coffee"], want_n=1, want_empty_due=True,
         note="срока нет — due_rel должен быть пустым"),
    dict(id="3.три_сущности", text="Завтра дейли по финмаркету, в пятницу сдать макеты лендинга, и не забыть заказать зерно для кофейни до конца месяца",
         want_projects=["finmarket", "aurora", "coffee"], want_n=3,
         note="три сущности, три разных срока"),
    dict(id="4.по_смыслу", text="Бариста жалуется на кофемашину, нужен ремонт",
         want_projects=["coffee"], want_n=1, want_empty_due=True,
         note="проект не назван — только по смыслу"),
    dict(id="5.смешанная_ссылка", text="По второму проекту клиент просит смету, а по тому что с лендингом — согласовать цвета",
         want_projects=["finmarket", "aurora"], want_n=2, want_empty_due=True,
         note="номер + описание вперемешку"),
    dict(id="6.решение", text="Надо решить: делаем мобильное приложение на React Native или нативно",
         want_projects=["finmarket"], want_n=1, want_kind="decision",
         note="это decision, не task"),
]


def ask(text, think=False):
    msg = text if think else text + " /no_think"
    body = json.dumps({
        "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": msg}],
        "temperature": 0.1, "max_tokens": 500,
        "response_format": {"type": "json_schema",
                            "json_schema": {"name": "inbox", "strict": True, "schema": SCHEMA}},
    }).encode()
    req = urllib.request.Request(API, data=body,
                                 headers={"Content-Type": "application/json",
                                          "Authorization": "Bearer " + KEY})
    t = time.time()
    with urllib.request.urlopen(req, timeout=600) as r:
        d = json.loads(r.read())
    return json.loads(d["choices"][0]["message"]["content"]), round(time.time() - t, 1)


def score(case, got):
    errs = []
    tasks = got.get("tasks", [])
    if len(tasks) != case["want_n"]:
        errs.append(f"сущностей {len(tasks)}, ожидалось {case['want_n']}")
    got_p = [t.get("project_id") for t in tasks]
    if sorted(got_p) != sorted(case["want_projects"]):
        errs.append(f"проекты {got_p}, ожидалось {case['want_projects']}")
    if case.get("want_empty_due"):
        bad = [t.get("due_rel") for t in tasks if t.get("due_rel", "").strip()]
        if bad:
            errs.append(f"выдуман срок: {bad}")
    if case.get("want_kind"):
        kinds = [t.get("kind") for t in tasks]
        if case["want_kind"] not in kinds:
            errs.append(f"kind {kinds}, ожидался {case['want_kind']}")
    return errs


def main():
    label = sys.argv[1] if len(sys.argv) > 1 else "model"
    think = len(sys.argv) > 2 and sys.argv[2] == "think"
    print(f"\n{'='*64}\nМОДЕЛЬ: {label}   reasoning: {'ВКЛ' if think else 'выкл'}\n{'='*64}")
    ok_total, t_total = 0, 0.0
    for c in CASES:
        try:
            got, dt = ask(c["text"], think)
            errs = score(c, got)
        except Exception as e:
            got, dt, errs = {}, 0.0, [f"сбой: {e}"]
        t_total += dt
        ok = not errs
        ok_total += ok
        print(f"\n[{c['id']}] {c['note']}  ({dt}с)")
        print("  " + ("✅ верно" if ok else "❌ " + "; ".join(errs)))
        for t in got.get("tasks", []):
            print(f"     {t.get('project_id'):10} | {t.get('kind'):8} | due='{t.get('due_rel')}' | {t.get('title','')[:44]}")
    print(f"\n{'-'*64}\nИТОГ {label}: {ok_total}/{len(CASES)} верно, суммарно {round(t_total,1)}с\n")


if __name__ == "__main__":
    main()
