INSERT INTO studies (name) VALUES ('study1');

INSERT INTO accounts (username, password, role)
VALUES ('QTestProband1',
        'dafb7a7b4ae61f8c9dc76945f7e8f697256fdfa5a409ad059ec91c9b24cd6a7c404b5b1d8a88fea9faa32650c1e1baf4f750967ae0f8da92699c46dd7002f1f1eb9dda46f6555a304da1c0da5a7f0d81fcdaa39e1122862c2ae01cf5ce18b9aaf2ddb9021f2cba149eed0e73c130a8c464f9619bdfa6a3b778186ebc61707bf3',
        'Proband'),
       ('QTestProband2',
        'ef1d7c0681bbda9add88c3a0cbd6a254e54fb35531f066bca68bdce596c4d73cdab2a638ce4632eb3463fa965469f75d48672b0a8972a169da39e2ddc29403c7',
        'Proband'),
       ('QTestForscher1',
        'dafb7a7b4ae61f8c9dc76945f7e8f697256fdfa5a409ad059ec91c9b24cd6a7c404b5b1d8a88fea9faa32650c1e1baf4f750967ae0f8da92699c46dd7002f1f1eb9dda46f6555a304da1c0da5a7f0d81fcdaa39e1122862c2ae01cf5ce18b9aaf2ddb9021f2cba149eed0e73c130a8c464f9619bdfa6a3b778186ebc61707bf3',
        'Forscher'),
       ('forscher@test.de',
        'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
        'Forscher'),
       ('pm@test.de',
        'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
        'ProbandenManager'),
       ('ut@test.de',
        'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
        'Untersuchungsteam'),
       ('sysadmin@test.de',
        'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
        'SysAdmin');

INSERT INTO probands (pseudonym, study)
VALUES ('QTestProband1','study1'),
       ('QTestProband2','study1');


-- INSERT INTO study_users (user_id, study_id)
-- VALUES ('QTestProband1','study1'),
--        ('QTestProband2','study1');
