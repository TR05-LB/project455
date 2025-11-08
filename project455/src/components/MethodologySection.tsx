import { BookOpen, Code, Lock, Eye, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export const MethodologySection = () => {
  return (
    <div className="space-y-8">
      <Card className="p-8 glass-effect text-center">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 mb-4">
          <BookOpen className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3">
          How It Works
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Understanding LSB Steganography and XOR Encryption
        </p>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 glass-effect border-primary/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Encoding Process
            </h3>
          </div>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>Message is encrypted using XOR cipher with your secret key</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>Encrypted message is converted to binary format</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>Each bit is embedded in the least significant bit of audio samples</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>Modified audio file is saved with hidden message intact</span>
            </li>
          </ol>
        </Card>

        <Card className="p-6 glass-effect border-accent/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/20">
              <Eye className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Decoding Process
            </h3>
          </div>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-accent">1.</span>
              <span>Extract least significant bits from audio samples</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-accent">2.</span>
              <span>Reconstruct binary message from extracted bits</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-accent">3.</span>
              <span>Decrypt message using XOR cipher with your key</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-accent">4.</span>
              <span>Original message is recovered perfectly</span>
            </li>
          </ol>
        </Card>
      </div>

      <Card className="p-6 glass-effect">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/20">
            <Code className="w-5 h-5 text-secondary-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Technical Details
          </h3>
        </div>
        <div className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">LSB (Least Significant Bit) Method</h4>
            <p className="text-sm">
              The LSB method modifies the least significant bit of each audio sample to store one bit of the hidden message.
              Since these bits have minimal impact on audio quality, the changes are imperceptible to human hearing.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">XOR Encryption</h4>
            <p className="text-sm">
              Before embedding, messages are encrypted using XOR cipher with a user-provided key.
              This adds an extra layer of security, ensuring that even if someone detects hidden data,
              they cannot read it without the correct key.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">File Format</h4>
            <p className="text-sm">
              Supports WAV audio files (PCM, 16-bit) and video files (MP4, WebM, AVI, MOV, etc.).
              For audio: The WAV header (44 bytes) is preserved, and data is embedded starting from byte 45.
              For video: Audio is extracted from the video, processed with LSB steganography, then recombined.
              Message length is encoded first (4 bytes), followed by the encrypted message.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 glass-effect border-primary/30">
        <div className="flex items-start gap-4">
          <ArrowRight className="w-6 h-6 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Security Best Practices
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use strong, unique encryption keys for each message</li>
              <li>• Never share keys over insecure channels</li>
              <li>• Keep your stego files secure - they contain hidden information</li>
              <li>• Remember: Steganography provides concealment, not encryption alone</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

