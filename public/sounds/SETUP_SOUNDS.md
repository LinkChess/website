# Setting Up Sound Files for ChessLink

This guide will help you set up the sound files required for the ChessLink application's audio feedback system.

## Quick Setup

1. **Download a chess sound pack** from one of the resources listed below
2. **Rename the files** according to the required names in this directory
3. **Convert the files** to MP3 format if they aren't already
4. **Place all files** in this `public/sounds/` directory

## Required Sound Files

| Filename | Description | Suggested Sound |
|----------|-------------|-----------------|
| `move.mp3` | Standard piece movement | Wood piece tap or click |
| `capture.mp3` | When capturing a piece | Dramatic wood knock or impact |
| `check.mp3` | When a king is in check | Alert tone or bell |
| `checkmate.mp3` | When checkmate occurs | Victory fanfare or gong |
| `castle.mp3` | When castling | Double piece movement sound |
| `promotion.mp3` | When a pawn is promoted | Ascending chime or leveling up sound |
| `victory.mp3` | When a player wins | Triumphant fanfare |
| `draw.mp3` | When game ends in draw | Neutral tone sequence |
| `illegal.mp3` | Illegal move attempt | Error buzz or negative tone |
| `en_passant.mp3` | En passant capture | Special capture sound |
| `low_time.mp3` | Time running low | Ticking clock or hurry up sound |

## Finding Sound Files

### Option 1: Download a Complete Pack

Several chess applications and websites offer sound packs that you can download and use:

1. **Lichess Sounds**: 
   - Visit [Lichess Resources](https://github.com/lichess-org/lila/tree/master/public/sound)
   - Download the sound files and rename them according to our naming convention

2. **Chess.com Sounds**:
   - Inspect the network tab when playing on Chess.com
   - Find and download sound effect files
   - Rename according to our convention

3. **Open Source Chess Sounds**:
   - [OpenGameArt Chess Sounds](https://opengameart.org/content/chess-game-sounds)

### Option 2: Create Your Own Pack

You can create a custom sound pack by downloading individual sounds:

1. **Free Sound Resources**:
   - [Freesound.org](https://freesound.org/search/?q=chess)
   - [ZapSplat](https://www.zapsplat.com/sound-effect-categories/)
   - [Soundsnap](https://www.soundsnap.com/)

2. **AI-Generated Sounds**:
   - Use services like [AIVA](https://www.aiva.ai/) or [Soundraw](https://soundraw.io/) to generate custom sounds

## File Format Conversion

If your sound files are not in MP3 format, you can convert them using:

1. **Online Converters**:
   - [Online Audio Converter](https://online-audio-converter.com/)
   - [Convertio](https://convertio.co/audio-converter/)

2. **Desktop Applications**:
   - [Audacity](https://www.audacityteam.org/) (Free, open-source)
   - [FFmpeg](https://ffmpeg.org/) (Command-line tool)

## Testing Sounds

After placing the sound files in this directory:

1. Start the application with `npm run dev`
2. Make moves on the chessboard to test different sounds
3. If sounds aren't playing, check the browser console for errors

## Customizing Sound Settings

Users can customize sound playback through the chess interface:
- Toggle sound effects on/off
- Toggle speech announcements on/off
- (Future update) Adjust volume levels

## Troubleshooting

- If sounds aren't playing, check that the files exist in the correct location
- Ensure the sound files are properly formatted MP3 files
- Check the browser console for any errors related to audio playback
- Verify that your browser allows audio playback (some browsers block autoplay) 