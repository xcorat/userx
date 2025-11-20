-- D1 Seed Data
-- Generated from mock-data.ts with Ed25519 public keys

-- Users (using Ed25519 public keys as IDs)
INSERT INTO users (public_key, username, name, email, avatar_url, created_at, updated_at) VALUES ('MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', 'alicejohnson', 'Alice Johnson', 'alice@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', '2024-01-15T00:00:00.000Z', '2024-01-15T00:00:00.000Z');
INSERT INTO users (public_key, username, name, email, avatar_url, created_at, updated_at) VALUES ('MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', 'bobsmith', 'Bob Smith', 'bob@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', '2024-01-20T00:00:00.000Z', '2024-01-20T00:00:00.000Z');
INSERT INTO users (public_key, username, name, email, avatar_url, created_at, updated_at) VALUES ('MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=', 'caroldavis', 'Carol Davis', 'carol@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol', '2024-02-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z');
INSERT INTO users (public_key, username, name, email, avatar_url, created_at, updated_at) VALUES ('MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=', 'davidwilson', 'David Wilson', 'david@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', '2024-02-10T00:00:00.000Z', '2024-02-10T00:00:00.000Z');
INSERT INTO users (public_key, username, name, email, avatar_url, created_at, updated_at) VALUES ('MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=', 'emmabrown', 'Emma Brown', 'emma@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', '2024-02-15T00:00:00.000Z', '2024-02-15T00:00:00.000Z');

-- User keypairs (encrypted with password "password")
INSERT INTO user_keypairs (public_key, encrypted_private_key, created_at) VALUES ('MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', '+g0GC4s8riyOCQpHde1yHPkcBoM3ZQQ3dQw6to7V39fqKxiefwnnvNmDSsjnQJCamazoKzGPpHXM4j7kFHEp+s1jGyB7uusYZX1xF0S9AEiQ7tQwPDrwJWMm0d6NTsaj1yLlV0iFgd39jSfG', datetime('now'));
INSERT INTO user_keypairs (public_key, encrypted_private_key, created_at) VALUES ('MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', '/NNHG8seCEpl5pMWGmuH2fsc0/zB9w7/7gmNF9r3Ms1njQKGVmsLssETtH/Q0ZK9+ttZzpUwA/u9uLJqisQ0HPVwnBPBnn+fpZkpbPuLiLLwVoquN5V+Q2nUhof+folVPj8ojLBsQm2aJa4S', datetime('now'));
INSERT INTO user_keypairs (public_key, encrypted_private_key, created_at) VALUES ('MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=', '4RFWtI9obYXxVUQ6/yFVtyl2gjLQPd+X3tVvzx0tKeerbf6zknB9Fo87U/S9FsCyk16GBeAD1pN/eXVqnfPBeJK3tG0rN6T/IY1WBWPsBSxG0p2gGG1JAn668emPRbyBb8SFk422gHiTbVz6', datetime('now'));
INSERT INTO user_keypairs (public_key, encrypted_private_key, created_at) VALUES ('MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=', 'FX54Yc0rR6wnqS5QzlwOQgav7g/Gx6IKipoPSgRmufkfMSLMG7JrFwcngvkqHujjtH+nJJYVdThWlem/RZOyRdue0afkmky+MuJkotSjiOWeJPyM/0fiJFwBvhbPQNT/nIoPJvnpbDaL+ghs', datetime('now'));
INSERT INTO user_keypairs (public_key, encrypted_private_key, created_at) VALUES ('MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=', 'Yp/nu3h/q667MD2ubPaLQNhcBoXSN7H4K5360VRJRqqKGILNX/QRoW3nkvgdrG/H89Y87YGMqmaSjnTydKCCodifplC262kpdnUJTE0cwFfwh8hbip3/uZQRzBqcI0+TpHE6/fdDv4SoA28w', datetime('now'));

-- Public questions
INSERT INTO public_questions (id, text, created_by, created_at) VALUES ('q_1', 'What''s your ideal weekend activity?', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', '2024-03-01T00:00:00.000Z');
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q1_c1', 'q_1', 'Outdoor adventure', 0);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q1_c2', 'q_1', 'Reading at home', 1);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q1_c3', 'q_1', 'Social gathering', 2);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q1_c4', 'q_1', 'Creative projects', 3);

INSERT INTO public_questions (id, text, created_by, created_at) VALUES ('q_2', 'Coffee or tea?', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', '2024-03-05T00:00:00.000Z');
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q2_c1', 'q_2', 'Coffee all the way', 0);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q2_c2', 'q_2', 'Tea person', 1);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q2_c3', 'q_2', 'Both equally', 2);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q2_c4', 'q_2', 'Neither', 3);

INSERT INTO public_questions (id, text, created_by, created_at) VALUES ('q_3', 'How do you prefer to work?', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', '2024-03-08T00:00:00.000Z');
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q3_c1', 'q_3', 'Early morning', 0);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q3_c2', 'q_3', 'Late night', 1);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q3_c3', 'q_3', 'Flexible hours', 2);

INSERT INTO public_questions (id, text, created_by, created_at) VALUES ('q_4', 'Favorite type of music?', 'MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=', '2024-03-10T00:00:00.000Z');
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q4_c1', 'q_4', 'Rock/Pop', 0);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q4_c2', 'q_4', 'Classical', 1);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q4_c3', 'q_4', 'Hip Hop/Rap', 2);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q4_c4', 'q_4', 'Electronic', 3);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q4_c5', 'q_4', 'Jazz/Blues', 4);

INSERT INTO public_questions (id, text, created_by, created_at) VALUES ('q_5', 'Beach or mountains?', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', '2024-03-12T00:00:00.000Z');
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q5_c1', 'q_5', 'Beach vacation', 0);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q5_c2', 'q_5', 'Mountain getaway', 1);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q5_c3', 'q_5', 'City exploration', 2);

INSERT INTO public_questions (id, text, created_by, created_at) VALUES ('q_6', 'How do you handle stress?', 'MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=', '2024-03-14T00:00:00.000Z');
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q6_c1', 'q_6', 'Exercise', 0);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q6_c2', 'q_6', 'Meditation', 1);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q6_c3', 'q_6', 'Talk to friends', 2);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q6_c4', 'q_6', 'Work through it', 3);

INSERT INTO public_questions (id, text, created_by, created_at) VALUES ('q_7', 'Preferred learning style?', 'MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=', '2024-03-16T00:00:00.000Z');
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q7_c1', 'q_7', 'Visual (videos, diagrams)', 0);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q7_c2', 'q_7', 'Reading', 1);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q7_c3', 'q_7', 'Hands-on practice', 2);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q7_c4', 'q_7', 'Discussion', 3);

INSERT INTO public_questions (id, text, created_by, created_at) VALUES ('q_8', 'Dogs or cats?', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', '2024-03-18T00:00:00.000Z');
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q8_c1', 'q_8', 'Dogs', 0);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q8_c2', 'q_8', 'Cats', 1);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q8_c3', 'q_8', 'Both!', 2);
INSERT INTO question_choices (id, question_id, text, order_index) VALUES ('q8_c4', 'q_8', 'Neither', 3);

-- Public answers
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_1', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', 'q_2', 'q2_c1', 'public', '2024-03-06T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_2', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', 'q_1', 'q1_c3', 'public', '2024-03-02T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_3', 'MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=', 'q_1', 'q1_c1', 'private', '2024-03-03T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_4', 'MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=', 'q_1', 'q1_c2', 'public', '2024-03-03T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_5', 'MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=', 'q_1', 'q1_c3', 'public', '2024-03-04T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_6', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', 'q_2', 'q2_c2', 'public', '2024-03-06T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_7', 'MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=', 'q_2', 'q2_c1', 'public', '2024-03-07T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_8', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', 'q_3', 'q3_c3', 'private', '2024-03-09T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_9', 'MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=', 'q_2', 'q2_c3', 'public', '2024-03-07T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_10', 'MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=', 'q_3', 'q3_c1', 'public', '2024-03-09T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_11', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', 'q_5', 'q5_c2', 'public', '2024-03-13T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_12', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', 'q_5', 'q5_c1', 'public', '2024-03-13T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_13', 'MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=', 'q_5', 'q5_c3', 'private', '2024-03-13T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_14', 'MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=', 'q_8', 'q8_c1', 'public', '2024-03-19T00:00:00.000Z');
INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) VALUES ('ans_15', 'MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=', 'q_8', 'q8_c3', 'public', '2024-03-19T00:00:00.000Z');

-- DM questions
INSERT INTO dm_questions (id, text, from_user_id, to_user_id, created_at) VALUES ('dmq_1', 'What do you think about the new project?', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', '2024-03-10T00:00:00.000Z');
INSERT INTO dm_question_choices (id, dm_question_id, text, order_index) VALUES ('dmq1_c1', 'dmq_1', 'Excited!', 0);
INSERT INTO dm_question_choices (id, dm_question_id, text, order_index) VALUES ('dmq1_c2', 'dmq_1', 'Cautiously optimistic', 1);
INSERT INTO dm_question_choices (id, dm_question_id, text, order_index) VALUES ('dmq1_c3', 'dmq_1', 'Concerned', 2);

INSERT INTO dm_questions (id, text, from_user_id, to_user_id, created_at) VALUES ('dmq_2', 'Want to grab lunch this week?', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', '2024-03-11T00:00:00.000Z');
INSERT INTO dm_question_choices (id, dm_question_id, text, order_index) VALUES ('dmq2_c1', 'dmq_2', 'Yes, sounds great!', 0);
INSERT INTO dm_question_choices (id, dm_question_id, text, order_index) VALUES ('dmq2_c2', 'dmq_2', 'Maybe next week', 1);
INSERT INTO dm_question_choices (id, dm_question_id, text, order_index) VALUES ('dmq2_c3', 'dmq_2', 'Too busy right now', 2);

INSERT INTO dm_questions (id, text, from_user_id, to_user_id, created_at) VALUES ('dmq_3', 'How are you feeling today?', 'MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', '2024-03-12T00:00:00.000Z');

-- DM answers
INSERT INTO dm_answers (id, dm_question_id, user_id, choice_id, text_answer, created_at) VALUES ('dmans_1', 'dmq_1', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', 'dmq1_c2', NULL, '2024-03-11T00:00:00.000Z');
INSERT INTO dm_answers (id, dm_question_id, user_id, choice_id, text_answer, created_at) VALUES ('dmans_2', 'dmq_3', 'MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=', NULL, 'I''m doing great, thanks for asking!', '2024-03-12T00:00:00.000Z');

-- Memes
INSERT INTO memes (id, content_hash, image_url, alt_text, submitted_by, submitted_at, width, height, is_animated, frame_count) VALUES ('meme_1', 'hash_distracted_bf', 'https://i.imgflip.com/1ur9b0.jpg', 'Distracted Boyfriend meme - man looking at another woman while his girlfriend looks disapproving', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', '2024-11-13T10:00:00.000Z', 680, 450, 0, NULL);
INSERT INTO memes (id, content_hash, image_url, alt_text, submitted_by, submitted_at, width, height, is_animated, frame_count) VALUES ('meme_2', 'hash_drake_pointing', 'https://i.imgflip.com/30b1gx.jpg', 'Drake pointing meme - Drake rejecting something, then pointing approvingly at something else', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', '2024-11-13T11:30:00.000Z', 500, 600, 0, NULL);
INSERT INTO memes (id, content_hash, image_url, alt_text, submitted_by, submitted_at, width, height, is_animated, frame_count) VALUES ('meme_3', 'hash_woman_yelling_cat', 'https://i.imgflip.com/345v97.jpg', 'Woman yelling at confused cat meme', 'MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=', '2024-11-13T14:15:00.000Z', 680, 438, 0, NULL);
INSERT INTO memes (id, content_hash, image_url, alt_text, submitted_by, submitted_at, width, height, is_animated, frame_count) VALUES ('meme_4', 'hash_this_is_fine', 'https://i.imgflip.com/1wz2x6.jpg', 'This is fine dog sitting in burning room', 'MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=', '2024-11-13T16:45:00.000Z', 580, 282, 0, NULL);
INSERT INTO memes (id, content_hash, image_url, alt_text, submitted_by, submitted_at, width, height, is_animated, frame_count) VALUES ('meme_5', 'hash_expanding_brain', 'https://i.imgflip.com/1jwhww.jpg', 'Expanding brain meme template', 'MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=', '2024-11-14T08:20:00.000Z', 857, 1202, 0, NULL);

-- Meme interactions
INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at) VALUES ('interaction_1', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', 'meme_2', 'pick', '2024-11-13T12:00:00.000Z');
INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at) VALUES ('interaction_2', 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=', 'meme_3', 'reject', '2024-11-13T15:00:00.000Z');
INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at) VALUES ('interaction_3', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', 'meme_1', 'pick', '2024-11-13T11:00:00.000Z');
INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at) VALUES ('interaction_4', 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=', 'meme_4', 'pick', '2024-11-13T17:00:00.000Z');
INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at) VALUES ('interaction_5', 'MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=', 'meme_1', 'pick', '2024-11-13T11:30:00.000Z');
INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at) VALUES ('interaction_6', 'MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=', 'meme_2', 'reject', '2024-11-13T13:00:00.000Z');
INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at) VALUES ('interaction_7', 'MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=', 'meme_1', 'pick', '2024-11-13T12:30:00.000Z');
