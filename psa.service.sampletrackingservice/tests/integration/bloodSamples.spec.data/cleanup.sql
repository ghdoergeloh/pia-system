DELETE
FROM blood_samples
WHERE sample_id IN ('ZIFCO-1234567890', 'ZIFCO-1234567891', 'ZIFCO-1234567892', 'ZIFCO-1234567898', 'ZIFCO-1234567899',
                    'ZIFCO-1111111111');

DELETE
FROM accounts
WHERE username LIKE 'QTest%';

DELETE
FROM probands
WHERE pseudonym LIKE 'QTest%';

DELETE
FROM studies
WHERE name LIKE 'QTest%';
