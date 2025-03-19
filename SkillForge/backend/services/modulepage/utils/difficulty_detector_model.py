#!/usr/bin/env python3
"""
Simple Difficulty Prediction Script
"""
import sys
import json
import traceback

def predict_difficulty(data):
    """
    Predicts difficulty based on video interaction metrics
    """
    # Extract features with default values
    session_duration = data.get('session_duration', 0)
    total_pauses = data.get('total_pauses', 0)
    pause_median_duration = data.get('pause_median_duration', 0)
    replay_frequency = data.get('replay_frequency', 0)
    replay_duration = data.get('replay_duration', 0)
    seek_forward_frequency = data.get('seek_forward_frequency', 0)
    skipped_content = data.get('skipped_content', 0)
    speed_changes = data.get('speed_changes', 0)
    average_speed = data.get('average_speed', 1.0)
    pause_rate = data.get('pause_rate', 0)
    replay_ratio = data.get('replay_ratio', 0)
    
    # Normalize session duration to minutes for easier interpretation
    minutes_watched = max(session_duration / 60, 0.1)  # Avoid division by zero
    
    # Initialize difficulty detection
    difficulty_score = 0
    confidence = 0.5  # Default confidence
    insights = []
    
    # Calculate difficulty score (positive values indicate difficulty)
    
    # 1. Pause behavior (major indicator of difficulty)
    if pause_rate > 10:  # Very high pause rate
        difficulty_score += 3.0
        insights.append("High frequency of pauses suggests difficulty with content")
    elif pause_rate > 5:  # Moderate pause rate
        difficulty_score += 1.5
    
    # 2. Replay behavior (strong indicator of difficulty)
    if replay_frequency > 3:  # Multiple replays
        difficulty_score += 3.0
        insights.append("Multiple content replays suggest challenging concepts")
    elif replay_frequency > 0:  # Some replays
        difficulty_score += 1.5
        insights.append("Content was replayed, suggesting review of challenging sections")
    
    if replay_ratio > 0.2:  # Significant portion of time spent on replays
        difficulty_score += 2.0
        insights.append("Significant time spent rewatching content indicates difficulty")
    
    # 3. Playback speed - NOTE: Higher speed actually may not indicate ease
    # Users often increase speed when they have to watch a lot of content
    if average_speed > 1.5:
        # Only minor reduction to difficulty score
        difficulty_score -= 0.5
        insights.append("Increased playback speed suggests comfortable understanding")
    elif average_speed < 0.9:  # Slower than normal is definitely difficulty
        difficulty_score += 2.0
        insights.append("Reduced playback speed suggests content is challenging")
    
    # 4. Content skipping
    if seek_forward_frequency > 3 and skipped_content > session_duration * 0.3:
        # Only reduce difficulty if skipping a significant portion (>30%)
        difficulty_score -= 1.0
        insights.append("Skipping forward suggests familiarity with content")
    
    # Make final prediction
    # Set threshold for difficulty - positive score means difficult 
    is_difficult = difficulty_score > 0
    
    # Determine confidence level based on the magnitude of the score
    # Very high positive or negative scores = high confidence
    confidence = 0.5 + min(abs(difficulty_score) * 0.1, 0.45)
    
    # Override: If we have clear indicators of difficulty, ensure difficulty=1
    if replay_frequency > 2 and pause_rate > 10:
        is_difficult = True
        confidence = 0.9
    
    # Override: Short sessions with many pauses are difficult
    if session_duration < 60 and pause_rate > 8:
        is_difficult = True
        confidence = 0.85
    
    # If no insights were generated, add a default one
    if not insights:
        if is_difficult:
            insights.append("Your viewing pattern suggests you may find this content challenging")
        else:
            insights.append("Your viewing pattern suggests comfortable understanding of the content")
    
    # Show reasoning in debug output
    print(f"Debug: Difficulty score = {difficulty_score}, is_difficult = {is_difficult}, confidence = {confidence}", file=sys.stderr)
    print(f"Debug: replay_frequency = {replay_frequency}, pause_rate = {pause_rate}", file=sys.stderr)
    
    # Return prediction results
    return {
        "predicted_difficulty": 1 if is_difficult else 0,
        "confidence": confidence,
        "insights": insights,
        "difficulty_score": difficulty_score
    }

def main():
    try:
        # Check arguments
        if len(sys.argv) != 2:
            print(json.dumps({
                "predicted_difficulty": 0,
                "confidence": 0.5,
                "insights": ["Invalid arguments provided to prediction script"]
            }))
            return 1
        
        # Get input data from command line argument (JSON string)
        input_data = json.loads(sys.argv[1])
        
        # Make prediction
        prediction = predict_difficulty(input_data)
        
        # Print result as JSON
        print(json.dumps(prediction))
        return 0
        
    except Exception as e:
        # Return error information
        error_info = traceback.format_exc()
        print(json.dumps({
            "predicted_difficulty": 0,
            "confidence": 0.5,
            "error": str(e),
            "insights": ["Error in difficulty prediction"]
        }))
        sys.stderr.write(f"Error in prediction script: {str(e)}\n{error_info}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())