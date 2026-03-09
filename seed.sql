-- Insert sample entries
INSERT OR IGNORE INTO entries (date, content, keyword, category) VALUES 
  ('2023-10-19', 'The fog lifted and the path forward became clear today.', 'Clarity', 'Growth'),
  ('2023-10-20', 'Reconnecting with an old friend over coffee after five years.', 'Connection', 'Relationship'),
  ('2023-10-21', 'Long walks and deep thoughts about the upcoming year.', 'Reflection', 'Growth'),
  ('2023-10-22', 'Finally broke through the creative block on the new project.', 'Momentum', 'Event'),
  ('2023-10-23', 'Feeling thankful for the supportive team at the studio.', 'Gratitude', 'Relationship'),
  ('2023-10-24', 'A quiet morning spent watching the sunrise over the park.', 'Serenity', 'Emotion');

-- Insert sample memory gates
INSERT OR IGNORE INTO memory_gates (entry_id, question, question_sentence, correct_answer) VALUES 
  (1, 'Yesterday, I felt ____ while reflecting.', '오늘 맑은 하늘 아래 산책을 하며 Clarity를 느꼈다.', 'Clarity'),
  (2, 'I felt ____ with my friend.', '친구와 Connection을 통해 옛 추억을 떠올렸다.', 'Connection'),
  (3, 'Today was a day of ____.', '산책하며 Reflection의 시간을 가졌다.', 'Reflection'),
  (4, 'I found ____ in my work.', '마침내 프로젝트에서 Momentum을 찾았다.', 'Momentum'),
  (5, 'I felt ____ towards my team.', '팀원들에게 Gratitude를 느낀 하루였다.', 'Gratitude'),
  (6, 'I experienced ____ this morning.', '공원에서 일출을 보며 Serenity를 경험했다.', 'Serenity');


