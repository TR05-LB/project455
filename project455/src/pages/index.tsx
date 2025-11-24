import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeroSection } from "@/components/HeroSection";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { ChatPanel } from "@/components/ChatPanel";
import { EncoderPanel } from "@/components/EncoderPanel";
import { DecoderPanel } from "@/components/DecoderPanel";
import { MethodologySection } from "@/components/MethodologySection";
import { DemoPanel } from "@/components/DemoPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock, Unlock, BookOpen, Play, MessageCircle } from "lucide-react";

type MainTab = "demo" | "encode" | "decode" | "learn" | "chat";

function IndexPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("demo");

  const handleGetStarted = () => {
    // Scroll to the main interface
    document.getElementById("main-interface")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFeatureSelect = (tab: MainTab) => {
    setActiveTab(tab);
    document.getElementById("main-interface")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Theme Toggle */}
      <header className="fixed top-0 right-0 z-50 p-4">
        <ThemeToggle />
      </header>
      {/* Hero Section */}
      <HeroSection
        onGetStarted={handleGetStarted}
        onLearnMore={() => handleFeatureSelect("learn")}
      />

      {/* Feature Showcase */}
      <FeatureShowcase onFeatureSelect={handleFeatureSelect} />

      {/* Main Interface */}
      <section id="main-interface" className="py-16 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 animate-fade-in">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-foreground font-medium">
              {activeTab === "demo"
                ? "Demo"
                : activeTab === "encode"
                ? "Encode"
                : activeTab === "decode"
                ? "Decode"
                : activeTab === "chat"
                ? "Chat"
                : "Learn"}
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MainTab)} className="space-y-8">
            <div className="flex justify-center mb-8">
              <TabsList className="glass-effect p-1.5 h-auto animate-fade-in bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
                <TabsTrigger 
                  value="demo" 
                  className={`px-6 py-3 text-base gap-2 rounded-md transition-all duration-200 ${
                    activeTab === "demo" 
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md font-semibold" 
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Play className="w-4 h-4" />
                  Demo
                </TabsTrigger>
                <TabsTrigger 
                  value="encode" 
                  className={`px-6 py-3 text-base gap-2 rounded-md transition-all duration-200 ${
                    activeTab === "encode" 
                      ? "bg-primary text-primary-foreground shadow-md font-semibold" 
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Encode
                </TabsTrigger>
                <TabsTrigger 
                  value="decode" 
                  className={`px-6 py-3 text-base gap-2 rounded-md transition-all duration-200 ${
                    activeTab === "decode" 
                      ? "bg-accent text-accent-foreground shadow-md font-semibold" 
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Unlock className="w-4 h-4" />
                  Decode
                </TabsTrigger>
                <TabsTrigger 
                  value="chat" 
                  className={`px-6 py-3 text-base gap-2 rounded-md transition-all duration-200 ${
                    activeTab === "chat" 
                      ? "bg-muted text-foreground shadow-md font-semibold" 
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="learn" 
                  className={`px-6 py-3 text-base gap-2 rounded-md transition-all duration-200 ${
                    activeTab === "learn" 
                      ? "bg-secondary text-secondary-foreground shadow-md font-semibold" 
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Learn
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="demo" className="space-y-6">
              <div className="max-w-6xl mx-auto">
                <DemoPanel />
              </div>
            </TabsContent>

            <TabsContent value="encode" className="space-y-6">
              <div className="max-w-4xl mx-auto">
                <EncoderPanel />
              </div>
            </TabsContent>

            <TabsContent value="decode" className="space-y-6">
              <div className="max-w-4xl mx-auto">
                <DecoderPanel />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              <div className="max-w-5xl mx-auto">
                <ChatPanel />
              </div>
            </TabsContent>

            <TabsContent value="learn" className="space-y-6">
              <div className="max-w-6xl mx-auto">
                <MethodologySection />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Steganography</span> — The art of hidden communication
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm">
              <span className="px-3 py-1 rounded-full glass-effect text-muted-foreground">
                LSB Encoding
              </span>
              <span className="px-3 py-1 rounded-full glass-effect text-muted-foreground">
                XOR Encryption
              </span>
              <span className="px-3 py-1 rounded-full glass-effect text-muted-foreground">
                Zero Quality Loss
              </span>
              <span className="px-3 py-1 rounded-full glass-effect text-muted-foreground">
                Key-Based Security
              </span>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              Always store encryption keys securely. Never share them over insecure channels.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default IndexPage;
