// utils/difficultyDetection.js

const calculateDifficulty = (interactions, videoDuration) => {
  const pauseCount = interactions.filter(
    (i) => i.interactionType === "pause"
  ).length;
  const seekBackCount = interactions.filter(
    (i) => i.interactionType === "seek" && i.timestamp < i.previousTimestamp
  ).length;
  const seekForwardCount = interactions.filter(
    (i) => i.interactionType === "seek" && i.timestamp > i.previousTimestamp
  ).length;

  const playInteractions = interactions.filter(
    (i) => i.interactionType === "play"
  );
  const totalWatchTime = playInteractions.reduce((total, curr, index, arr) => {
    const nextPause = arr[index + 1] ? arr[index + 1].timestamp : videoDuration;
    return total + (nextPause - curr.timestamp);
  }, 0);

  const pauseFrequency = pauseCount / (videoDuration / 60); // pauses per minute
  const seekBackFrequency = seekBackCount / (videoDuration / 60); // seek backs per minute
  const seekForwardFrequency = seekForwardCount / (videoDuration / 60); // seek forwards per minute
  const watchTimeRatio = totalWatchTime / videoDuration;
  const replayCount = interactions.filter(
    (i) =>
      i.interactionType === "seek" &&
      i.timestamp < i.previousTimestamp &&
      i.previousTimestamp - i.timestamp > 10
  ).length;

  let difficultyScore = 0;
  difficultyScore += pauseFrequency * 3; // Each pause adds 3 points
  difficultyScore += seekBackFrequency * 4; // Each seek back adds 4 points
  difficultyScore += seekForwardFrequency * 1; // Each seek forward adds 1 point (skipping might indicate easiness)
  difficultyScore += (1 - watchTimeRatio) * 15; // Less watch time ratio adds up to 15 points
  difficultyScore += replayCount * 5; // Each significant rewind (>10 seconds) adds 5 points

  // Adjust score based on video duration
  difficultyScore = difficultyScore * (1 + videoDuration / 600); // Longer videos are potentially more difficult

  // Calculate engagement score
  const engagementScore =
    (pauseFrequency + seekBackFrequency + seekForwardFrequency) *
    watchTimeRatio;

  // Adjust difficulty based on engagement
  difficultyScore = difficultyScore * (1 + engagementScore / 10);

  if (difficultyScore < 10) return "Low";
  if (difficultyScore < 25) return "Moderate";
  return "High";
};

module.exports = { calculateDifficulty };
