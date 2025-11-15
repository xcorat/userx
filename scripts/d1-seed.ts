#!/usr/bin/env tsx
/**
 * D1 Database Seed Script
 * Populates Cloudflare D1 database with mock data for testing
 * 
 * Usage:
 *   pnpm tsx scripts/d1-seed.ts [database-name]
 * 
 * Or generate SQL file:
 *   pnpm tsx scripts/d1-seed.ts --generate-sql > scripts/d1-seed.sql
 */

import { mockUsers, mockQuestions, mockAnswers, mockDMQuestions, mockDMAnswers, mockMemes, mockMemeInteractions } from '../src/lib/repositories/implementations/mock/mock-data';

const generateSeedSQL = (): string => {
	const statements: string[] = [];

	// Insert users
	for (const user of mockUsers) {
		const escapedName = user.name.replace(/'/g, "''");
		const escapedEmail = user.email.replace(/'/g, "''");
		const escapedAvatar = user.avatarUrl ? `'${user.avatarUrl.replace(/'/g, "''")}'` : 'NULL';
		
		statements.push(
			`INSERT INTO users (id, username, name, email, password, avatar_url, created_at, updated_at) ` +
			`VALUES ('${user.id}', '${user.username}', '${escapedName}', '${escapedEmail}', 'password', ${escapedAvatar}, '${user.createdAt.toISOString()}', '${user.createdAt.toISOString()}');`
		);
	}

	// Insert questions and choices
	for (const question of mockQuestions) {
		const escapedText = question.text.replace(/'/g, "''");
		statements.push(
			`INSERT INTO public_questions (id, text, created_by, created_at) ` +
			`VALUES ('${question.id}', '${escapedText}', '${question.createdBy}', '${question.createdAt.toISOString()}');`
		);

		for (const choice of question.choices) {
			const escapedChoiceText = choice.text.replace(/'/g, "''");
			statements.push(
				`INSERT INTO question_choices (id, question_id, text, order_index) ` +
				`VALUES ('${choice.id}', '${question.id}', '${escapedChoiceText}', ${choice.order});`
			);
		}
	}

	// Insert public answers
	for (const answer of mockAnswers) {
		statements.push(
			`INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at) ` +
			`VALUES ('${answer.id}', '${answer.userId}', '${answer.questionId}', '${answer.choiceId}', '${answer.visibility}', '${answer.createdAt.toISOString()}');`
		);
	}

	// Insert DM questions and choices
	for (const dmQuestion of mockDMQuestions) {
		const escapedText = dmQuestion.text.replace(/'/g, "''");
		statements.push(
			`INSERT INTO dm_questions (id, text, from_user_id, to_user_id, created_at) ` +
			`VALUES ('${dmQuestion.id}', '${escapedText}', '${dmQuestion.senderId}', '${dmQuestion.recipientId}', '${dmQuestion.createdAt.toISOString()}');`
		);

		if (dmQuestion.choices) {
			for (const choice of dmQuestion.choices) {
				const escapedChoiceText = choice.text.replace(/'/g, "''");
				statements.push(
					`INSERT INTO dm_question_choices (id, dm_question_id, text, order_index) ` +
					`VALUES ('${choice.id}', '${dmQuestion.id}', '${escapedChoiceText}', ${choice.order});`
				);
			}
		}
	}

	// Insert DM answers
	for (const dmAnswer of mockDMAnswers) {
		const choiceId = dmAnswer.choiceId ? `'${dmAnswer.choiceId}'` : 'NULL';
		const textAnswer = dmAnswer.textAnswer ? `'${dmAnswer.textAnswer.replace(/'/g, "''")}'` : 'NULL';
		statements.push(
			`INSERT INTO dm_answers (id, dm_question_id, user_id, choice_id, text_answer, created_at) ` +
			`VALUES ('${dmAnswer.id}', '${dmAnswer.dmQuestionId}', '${dmAnswer.userId}', ${choiceId}, ${textAnswer}, '${dmAnswer.createdAt.toISOString()}');`
		);
	}

	// Insert memes
	for (const meme of mockMemes) {
		const escapedAltText = meme.altText ? `'${meme.altText.replace(/'/g, "''")}'` : 'NULL';
		const isAnimated = meme.isAnimated ? 1 : 0;
		const frameCount = meme.frameCount ? meme.frameCount : 'NULL';
		const width = meme.width ? meme.width : 'NULL';
		const height = meme.height ? meme.height : 'NULL';
		
		statements.push(
			`INSERT INTO memes (id, content_hash, image_url, alt_text, submitted_by, submitted_at, width, height, is_animated, frame_count) ` +
			`VALUES ('${meme.id}', '${meme.contentHash}', '${meme.imageUrl.replace(/'/g, "''")}', ${escapedAltText}, '${meme.submittedBy}', '${meme.submittedAt.toISOString()}', ${width}, ${height}, ${isAnimated}, ${frameCount});`
		);
	}

	// Insert meme interactions
	for (const interaction of mockMemeInteractions) {
		statements.push(
			`INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at) ` +
			`VALUES ('${interaction.id}', '${interaction.userId}', '${interaction.memeId}', '${interaction.interactionType}', '${interaction.interactedAt.toISOString()}');`
		);
	}

	return statements.join('\n');
};

// Main execution
const args = process.argv.slice(2);

if (args.includes('--generate-sql')) {
	// Generate SQL and output to stdout
	console.log('-- D1 Seed Data');
	console.log('-- Generated from mock-data.ts\n');
	console.log(generateSeedSQL());
} else {
	// Interactive mode - instructions for manual seeding
	console.log('╔════════════════════════════════════════════════════════════════╗');
	console.log('║                  D1 Database Seed Script                       ║');
	console.log('╚════════════════════════════════════════════════════════════════╝\n');
	
	const dbName = args[0] || 'qna-app-db';
	
	console.log(`Database: ${dbName}\n`);
	console.log('To seed your D1 database, run one of the following:\n');
	console.log('Option 1: Generate and execute SQL file');
	console.log('  pnpm tsx scripts/d1-seed.ts --generate-sql > scripts/d1-seed.sql');
	console.log(`  wrangler d1 execute ${dbName} --file=./scripts/d1-seed.sql\n`);
	
	console.log('Option 2: Direct execution (use for local D1)');
	console.log(`  wrangler d1 execute ${dbName} --local --file=./scripts/d1-seed.sql\n`);
	
	console.log('Data summary:');
	console.log(`  - ${mockUsers.length} users`);
	console.log(`  - ${mockQuestions.length} public questions`);
	console.log(`  - ${mockAnswers.length} public answers`);
	console.log(`  - ${mockDMQuestions.length} DM questions`);
	console.log(`  - ${mockDMAnswers.length} DM answers`);
	console.log(`  - ${mockMemes.length} memes`);
	console.log(`  - ${mockMemeInteractions.length} meme interactions`);
}
