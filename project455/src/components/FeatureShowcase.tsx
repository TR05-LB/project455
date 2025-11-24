import { Lock, Eye, Key, FileVideo, Shield, FileText, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

type FeatureTab = "demo" | "encode" | "decode" | "learn" | "chat";

interface FeatureShowcaseProps {
  onFeatureSelect?: (tab: FeatureTab) => void;
}

export const FeatureShowcase = ({ onFeatureSelect }: FeatureShowcaseProps) => {
  const features = [
    {
      icon: Lock,
      title: "AES-256 Protection",
      description: "CryptoSteganography encrypts every payload with AES-256 before it ever touches an image or video frame.",
      color: "primary",
      tab: "encode" as FeatureTab,
    },
    {
      icon: Key,
      title: "Password Driven",
      description: "One secret key unlocks audio, image, video and text channels—change it per message for maximum safety.",
      color: "accent",
      tab: "learn" as FeatureTab,
    },
    {
      icon: Eye,
      title: "Invisible Results",
      description: "Zero-width text watermarks and single-frame video tweaks are impossible to spot with the naked eye.",
      color: "secondary",
      tab: "demo" as FeatureTab,
    },
    {
      icon: FileVideo,
      title: "Image & Video Stego",
      description: "OpenCV handles frame extraction and recombination so you can hide data inside PNG/MP4 without artifacts.",
      color: "primary",
      tab: "encode" as FeatureTab,
    },
    {
      icon: FileText,
      title: "Text Watermarking",
      description: "Inject secrets into ordinary paragraphs with text_blind_watermark—copy & paste safe and invisible.",
      color: "accent",
      tab: "demo" as FeatureTab,
    },
    {
      icon: Shield,
      title: "Robust Audio Channel",
      description: "Optional Hamming ECC keeps classic LSB audio steganography resilient to noise and transcoding.",
      color: "secondary",
      tab: "decode" as FeatureTab,
    },
    {
      icon: MessageCircle,
      title: "Secret Chat",
      description: "Client-side encrypted WebSocket chat—open two tabs, agree on a key, and flip between cipher/plain text.",
      color: "primary",
      tab: "chat" as FeatureTab,
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for secure, multi-format steganography
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClasses = {
              primary: "bg-primary/20 text-primary",
              accent: "bg-accent/20 text-accent",
              secondary: "bg-secondary/20 text-secondary-foreground",
            };
            return (
              <Card
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => onFeatureSelect?.(feature.tab)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onFeatureSelect?.(feature.tab);
                  }
                }}
                className="group p-6 glass-effect border-primary/10 hover-lift transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 hover:border-primary/30 hover:shadow-glow-primary"
              >
                <div className={`w-12 h-12 rounded-lg ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Try It</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

