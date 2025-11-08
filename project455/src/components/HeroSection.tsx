import { ArrowDown, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Secure Audio Steganography
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Hide Messages in
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Plain Audio
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Encode secret messages into audio files using advanced LSB steganography
            with XOR encryption. Zero quality loss, maximum security.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={onGetStarted}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary px-8 py-6 text-lg group"
            >
              Get Started
              <ArrowDown className="w-5 h-5 ml-2 group-hover:translate-y-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary/50 text-primary hover:bg-primary/10 px-8 py-6 text-lg"
            >
              Learn More
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-xl glass-effect border border-primary/10 hover-lift">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Encode and decode messages in seconds
              </p>
            </div>
            
            <div className="p-6 rounded-xl glass-effect border border-primary/10 hover-lift">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Secure</h3>
              <p className="text-sm text-muted-foreground">
                XOR encryption with key-based protection
              </p>
            </div>
            
            <div className="p-6 rounded-xl glass-effect border border-primary/10 hover-lift">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4 mx-auto">
                <ArrowDown className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Zero Loss</h3>
              <p className="text-sm text-muted-foreground">
                Perfect audio quality, undetectable changes
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

