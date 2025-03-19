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

  const pauseFrequency = pauseCount / (videoDuration / 60);
  const seekBackFrequency = seekBackCount / (videoDuration / 60);
  const seekForwardFrequency = seekForwardCount / (videoDuration / 60);
  const watchTimeRatio = totalWatchTime / videoDuration;
  const replayCount = interactions.filter(
    (i) =>
      i.interactionType === "seek" &&
      i.timestamp < i.previousTimestamp &&
      i.previousTimestamp - i.timestamp > 10
  ).length;

  let difficultyScore = 0;
  difficultyScore += pauseFrequency * 3;
  difficultyScore += seekBackFrequency * 4;
  difficultyScore += seekForwardFrequency * 1;
  difficultyScore += (1 - watchTimeRatio) * 15;
  difficultyScore += replayCount * 5;

  difficultyScore = difficultyScore * (1 + videoDuration / 600);

  const engagementScore =
    (pauseFrequency + seekBackFrequency + seekForwardFrequency) *
    watchTimeRatio;

  difficultyScore = difficultyScore * (1 + engagementScore / 10);

  if (difficultyScore < 10) return "Low";
  if (difficultyScore < 25) return "Moderate";
  return "High";
};

module.exports = { calculateDifficulty };
