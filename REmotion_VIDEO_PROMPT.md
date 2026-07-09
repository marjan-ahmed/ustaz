# Ustaz App Remotion Video Generation Prompt

This document provides a specific prompt for generating Ustaz app marketing and demonstration videos using Remotion and React.

## Core Concept

Create a 30-second animated video demonstrating the Ustaz app workflow using React and Remotion. The video should showcase the user journey from service request to provider arrival with smooth animations and transitions.

## Remotion-Specific Prompt

### Composition Structure:
```tsx
// Create a main composition component that shows the complete Ustaz user journey
// Each scene should be timed to advance at specific intervals
// Use Framer Motion for smooth animations and transitions
// Implement SVG-based maps and icons for visual appeal
```

### Scene-by-Scene Implementation:

#### Scene 1: Service Selection (0-4 seconds)
- Implement animated service cards (electrician, plumber, carpenter, etc.)
- Use stagger animations for card appearance
- Highlight service selection with glowing effect
- Include title text with fade-in animation

#### Scene 2: Location Input (4-8 seconds)
- Animate address input field with typing effect
- Show GPS location detection animation
- Implement map visualization with zoom effect
- Use spring animations for location pin drop

#### Scene 3: Request Processing (8-12 seconds)
- Show animated "request sent" confirmation
- Implement loading spinner with pulse animation
- Use progress bar animation for request processing
- Include smooth transition effects

#### Scene 4: Provider Matching (12-16 seconds)
- Display animated provider cards with staggered appearance
- Show provider ratings with star animations
- Implement proximity visualization with expanding circles
- Use smooth scaling animations for provider profiles

#### Scene 5: Provider Acceptance (16-20 seconds)
- Show animated notification of provider acceptance
- Display provider details with slide-in effect
- Include professional photo with border glow
- Use bounce animations for confirmation elements

#### Scene 6: Real-time Tracking (20-24 seconds)
- Implement animated map showing provider movement
- Show moving marker with path animation
- Display ETA countdown with flip animation
- Use smooth zoom and pan effects for tracking

#### Scene 7: Service Completion (24-30 seconds)
- Show successful completion animation
- Display rating interface with star interactions
- Include thank you message with fade-in effect
- End with download/app store call-to-action

### Remotion Technical Specifications:
- Use Remotion's spring and interpolate functions for animations
- Implement responsive design for different aspect ratios
- Use SVG for map and icon elements
- Implement proper timing with frame calculations
- Use absolute positioning for layered elements
- Implement easing functions for natural movements

### Animation Guidelines:
- Use smooth easing curves (easeOutCubic, easeInCubic)
- Implement consistent animation durations
- Use staggered delays for sequential effects
- Apply spring physics for natural bouncing effects
- Include opacity transitions for fade effects
- Use scale transformations for size changes

### Visual Elements:
- Ustaz brand colors (primary: #DB4B0D, secondary: #a93a0b)
- Clean, modern UI elements
- Service icons (bolt for electrician, wrench for plumber, etc.)
- Map markers and tracking elements
- Mobile device mockup for app interface
- Provider and customer avatars

### Text Animations:
- Typing effect for location input
- Counter animation for provider search
- Flip animation for ETA display
- Fade-in for confirmation messages
- Slide-in for call-to-action elements

### Audio Considerations:
- Background music with subtle, professional tone
- Sound effects for interactions (button clicks, notifications)
- Audio sync for animations
- Optional voiceover track

### Code Structure:
- Organize components into reusable modules
- Use TypeScript for type safety
- Implement proper folder structure
- Separate animation logic from presentation
- Use constants for timing and styling

### Export Configuration:
- Duration: 900 frames (30 seconds at 30fps)
- Dimensions: 1280x720 (HD landscape) or 720x1280 (mobile portrait)
- Frame rate: 30 FPS
- Output format: MP4 with H.264 codec
- Quality: High (recommended for marketing materials)

### Sample Component Structure:
```tsx
const UstazWorkflowDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate current scene based on frame
  const currentScene = Math.floor(frame / (fps * 4)); // 4 seconds per scene

  // Animation values for each scene
  const sceneOpacity = (sceneIndex: number) => {
    if (currentScene === sceneIndex) {
      return interpolate(
        frame % (fps * 4),
        [0, fps, fps * 4],
        [0, 1, 1]
      );
    }
    return currentScene > sceneIndex ? 1 : 0;
  };

  // Scene animations
  const serviceCardScale = (cardIndex: number) => {
    return interpolate(
      frame % (fps * 4),
      [0, fps * 2],
      [0.5, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
  };

  // Implement the scenes with conditional rendering
  return (
    <AbsoluteFill>
      {/* Scene 1: Service Selection */}
      <Scene1 currentScene={currentScene} opacity={sceneOpacity(0)} scale={serviceCardScale(0)} />
      {/* Scene 2: Location Input */}
      <Scene2 currentScene={currentScene} opacity={sceneOpacity(1)} />
      {/* Additional scenes... */}
    </AbsoluteFill>
  );
};
```

This prompt provides specific technical guidance for implementing the Ustaz app demonstration video using Remotion with React and TypeScript.