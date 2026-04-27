import { createBotTemplate, executeBot, saveBotTemplate } from "@modules/bot-builder";

export const botsEndpoint = {
  createTemplate: createBotTemplate,
  save: saveBotTemplate,
  execute: executeBot,
};
