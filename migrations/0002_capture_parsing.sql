-- Промежуточное состояние записи: «взята в разбор».
--
-- Фоновый проход и ручной вызов брали одну и ту же ждущую запись и разбирали
-- её дважды: модель работала впустую, а событие могло завестись двумя путями.
-- Забрать запись из очереди можно только сменив ей состояние, а прежний набор
-- такого состояния не знал.
ALTER TABLE captures DROP CONSTRAINT captures_state_known;
ALTER TABLE captures ADD CONSTRAINT captures_state_known
    CHECK (state IN ('pending', 'parsing', 'parsed', 'kept', 'failed'));

-- Записи, застрявшие в разборе после перезапуска службы, возвращаются в
-- очередь: разбор идёт в памяти процесса, и с его смертью он не продолжится.
UPDATE captures SET state = 'pending' WHERE state = 'parsing';
