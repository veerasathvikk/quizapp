BEGIN;

-- Users (already added earlier, but in case you rerun, use ON CONFLICT to skip duplicates)
INSERT INTO users (email, name)
VALUES
  ('veerasathvikkuppam@gmail.com', 'Veera Sathvik Kuppam'),
  ('ruttalaram3421@gmail.com', 'Ruttala Ram'),
  ('k.veerasathvik@gmail.com', 'K. Veerasathvik')
ON CONFLICT (email) DO NOTHING;

-- Quizzes
INSERT INTO quizzes (owner_id, title, description, metadata)
VALUES
  ((SELECT id FROM users WHERE email='veerasathikkuppam@gmail.com'),
   'Science Quiz',
   'Covers basic physics, chemistry, and biology.',
   '{"tags":["science"],"difficulty":"easy"}'),

  ((SELECT id FROM users WHERE email='ruttalaram3421@gmail.com'),
   'History & Culture',
   'World history and cultural facts.',
   '{"tags":["history","culture"],"difficulty":"medium"}'),

  ((SELECT id FROM users WHERE email='k.veerasathvik@gmail.com'),
   'Sports Trivia',
   'Test your knowledge on sports and players.',
   '{"tags":["sports"],"difficulty":"easy"}'),

  ((SELECT id FROM users WHERE email='veerasathikkuppam@gmail.com'),
   'Movies & Entertainment',
   'Fun quiz about movies, music, and TV.',
   '{"tags":["entertainment"],"difficulty":"easy"}'),

  ((SELECT id FROM users WHERE email='ruttalaram3421@gmail.com'),
   'Geography Challenge',
   'Questions about countries, capitals, and landmarks.',
   '{"tags":["geography"],"difficulty":"medium"}');

-- Science Quiz Questions
INSERT INTO questions (quiz_id, question_text, options, correct_index, order_index) VALUES
  ((SELECT id FROM quizzes WHERE title='Science Quiz'),
   'What is H2O commonly known as?',
   '["Water","Oxygen","Hydrogen"]', 0, 1),
  ((SELECT id FROM quizzes WHERE title='Science Quiz'),
   'Which planet has the most gravity?',
   '["Earth","Jupiter","Mars","Venus"]', 1, 2),
  ((SELECT id FROM quizzes WHERE title='Science Quiz'),
   'DNA stands for?',
   '["Deoxyribonucleic Acid","Dynamic Nucleic Acid"]', 0, 3);

-- History & Culture Quiz Questions
INSERT INTO questions (quiz_id, question_text, options, correct_index, order_index) VALUES
  ((SELECT id FROM quizzes WHERE title='History & Culture'),
   'Who was the first President of the USA?',
   '["George Washington","Abraham Lincoln","John Adams","Thomas Jefferson"]', 0, 1),
  ((SELECT id FROM quizzes WHERE title='History & Culture'),
   'The Taj Mahal was built in which century?',
   '["15th","16th","17th","18th"]', 2, 2),
  ((SELECT id FROM quizzes WHERE title='History & Culture'),
   'The Olympic Games originated in?',
   '["Rome","Athens"]', 1, 3);

-- Sports Trivia Quiz Questions
INSERT INTO questions (quiz_id, question_text, options, correct_index, order_index) VALUES
  ((SELECT id FROM quizzes WHERE title='Sports Trivia'),
   'How many players are there in a football (soccer) team?',
   '["9","10","11","12"]', 2, 1),
  ((SELECT id FROM quizzes WHERE title='Sports Trivia'),
   'Which country has won the most Cricket World Cups?',
   '["India","Australia","England","West Indies","Pakistan"]', 1, 2),
  ((SELECT id FROM quizzes WHERE title='Sports Trivia'),
   'Usain Bolt is famous for which sport?',
   '["Basketball","Running","Cycling"]', 1, 3);

-- Movies & Entertainment Quiz Questions
INSERT INTO questions (quiz_id, question_text, options, correct_index, order_index) VALUES
  ((SELECT id FROM quizzes WHERE title='Movies & Entertainment'),
   'Which movie won Best Picture at the Oscars 2020?',
   '["Parasite","1917","Joker","Once Upon a Time in Hollywood"]', 0, 1),
  ((SELECT id FROM quizzes WHERE title='Movies & Entertainment'),
   'Who is known as the "King of Pop"?',
   '["Elvis Presley","Michael Jackson","Justin Bieber"]', 1, 2),
  ((SELECT id FROM quizzes WHERE title='Movies & Entertainment'),
   'Which superhero is part of Marvel?',
   '["Batman","Superman","Iron Man","Wonder Woman"]', 2, 3);

-- Geography Challenge Quiz Questions
INSERT INTO questions (quiz_id, question_text, options, correct_index, order_index) VALUES
  ((SELECT id FROM quizzes WHERE title='Geography Challenge'),
   'Which is the largest desert in the world?',
   '["Sahara","Arctic","Antarctica"]', 2, 1),
  ((SELECT id FROM quizzes WHERE title='Geography Challenge'),
   'Which river flows through Egypt?',
   '["Amazon","Nile","Ganges","Mississippi"]', 1, 2),
  ((SELECT id FROM quizzes WHERE title='Geography Challenge'),
   'Mount Everest is located in which two countries?',
   '["India & Nepal","Nepal & China","China & Bhutan"]', 1, 3);

COMMIT;
