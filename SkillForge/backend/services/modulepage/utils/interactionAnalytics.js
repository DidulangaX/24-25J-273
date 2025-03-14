function generateSummary(interactions, videoDuration) {
  let summary = {
    totalPauses: 0,
    totalPlays: 0,
    totalSeeks: 0,
    totalWatchTime: 0,
    rewatchedSections: [],
    skippedSections: [],
  };

  let lastPlayTime = 0;
  let lastTimestamp = 0;

  interactions.forEach((interaction, index) => {
    switch (interaction.interactionType) {
      case "play":
        summary.totalPlays++;
        lastPlayTime = interaction.timestamp;
        break;
      case "pause":
        summary.totalPauses++;
        summary.totalWatchTime += interaction.timestamp - lastPlayTime;
        break;
      case "seek":
        summary.totalSeeks++;
        if (interaction.timestamp < lastTimestamp) {
          summary.rewatchedSections.push({
            start: interaction.timestamp,
            end: lastTimestamp,
          });
        } else if (interaction.timestamp > lastTimestamp + 5) {
          summary.skippedSections.push({
            start: lastTimestamp,
            end: interaction.timestamp,
          });
        }
        break;
    }
    lastTimestamp = interaction.timestamp;
  });

  return summary;
}

module.exports = {
  generateSummary,
};
