import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  SOUNDS, 
  playSound, 
  speakText,
  getMoveText
} from '@/lib/soundUtils';
import { Volume2, Mic, Settings2 } from 'lucide-react';

/**
 * Sound testing component for ChessLink
 * Allows users to test different sounds and speech synthesis
 */
const SoundTest: React.FC = () => {
  // Sound settings
  const [volume, setVolume] = useState(0.5);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  // Speech synthesis settings
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  
  // Handle playing a sound
  const handlePlaySound = (soundName: keyof typeof SOUNDS) => {
    if (effectsEnabled) {
      playSound(soundName, volume);
    }
  };
  
  // Sample chess moves for speech testing
  const sampleMoves = [
    { piece: 'p', from: 'e2', to: 'e4', san: 'e4' },
    { piece: 'n', from: 'g1', to: 'f3', san: 'Nf3' },
    { piece: 'r', from: 'a1', to: 'e1', san: 'Rae1' },
    { piece: 'k', from: 'e1', to: 'g1', san: 'O-O' },
    { piece: 'q', from: 'd1', to: 'h5', san: 'Qh5+', flags: '+' },
    { piece: 'p', from: 'e7', to: 'e8', san: 'e8=Q', promotion: 'q' },
    { piece: 'p', from: 'd2', to: 'e1', san: 'dxe1=Q+', captured: 'r', promotion: 'q', flags: '+' }
  ];
  
  // Handle speaking a sample move
  const handleSpeakMove = (moveIndex: number) => {
    if (speechEnabled) {
      const move = sampleMoves[moveIndex];
      const moveText = getMoveText(move);
      
      const options = new SpeechSynthesisUtterance();
      options.rate = speechRate;
      options.pitch = speechPitch;
      options.volume = volume;
      
      speakText(moveText, options);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Sound Test and Configuration
        </CardTitle>
        <CardDescription>
          Test and configure sound effects and speech synthesis for the ChessLink system
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sound Effects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Sound Effects
            </h3>
            <Switch 
              checked={effectsEnabled} 
              onCheckedChange={setEffectsEnabled} 
              id="sound-effects-toggle"
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(SOUNDS) as Array<keyof typeof SOUNDS>).map((sound) => (
              <Button 
                key={sound} 
                variant="outline" 
                onClick={() => handlePlaySound(sound)}
                disabled={!effectsEnabled}
                className="text-xs capitalize"
              >
                {sound.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Speech Synthesis Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Speech Synthesis
            </h3>
            <Switch 
              checked={speechEnabled} 
              onCheckedChange={setSpeechEnabled} 
              id="speech-toggle"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sampleMoves.map((move, index) => (
              <Button 
                key={index} 
                variant="outline" 
                onClick={() => handleSpeakMove(index)}
                disabled={!speechEnabled}
                className="text-sm justify-start"
              >
                <span className="font-mono mr-2">{move.san}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {getMoveText(move)}
                </span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Settings Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Settings</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume-slider">Volume: {Math.round(volume * 100)}%</Label>
              </div>
              <Slider
                id="volume-slider"
                min={0}
                max={1}
                step={0.05}
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rate-slider">Speech Rate: {speechRate.toFixed(1)}x</Label>
              </div>
              <Slider
                id="rate-slider"
                min={0.5}
                max={2}
                step={0.1}
                value={[speechRate]}
                onValueChange={(values) => setSpeechRate(values[0])}
                disabled={!speechEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pitch-slider">Speech Pitch: {speechPitch.toFixed(1)}</Label>
              </div>
              <Slider
                id="pitch-slider"
                min={0.5}
                max={2}
                step={0.1}
                value={[speechPitch]}
                onValueChange={(values) => setSpeechPitch(values[0])}
                disabled={!speechEnabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Settings are applied immediately
        </div>
      </CardFooter>
    </Card>
  );
};

export default SoundTest; 