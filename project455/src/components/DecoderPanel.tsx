import { useState } from "react";
import { Upload, Unlock, FileAudio, FileVideo, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { decodeAudio, decodeVideo, isVideoFile, isAudioFile } from "@/lib/steganography";

export const DecoderPanel = () => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [key, setKey] = useState("");
  const [isDecoding, setIsDecoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [decodedMessage, setDecodedMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isAudioFile(file) && !isVideoFile(file)) {
        toast.error("Please select an audio (WAV) or video (MP4, WebM, etc.) file");
        return;
      }
      setMediaFile(file);
      setDecodedMessage("");
      const fileType = isVideoFile(file) ? "Video" : "Audio";
      toast.success(`${fileType} file selected`);
    }
  };

  const handleDecode = async () => {
    if (!mediaFile) {
      toast.error("Please select an audio or video file");
      return;
    }
    if (!key.trim()) {
      toast.error("Please enter the encryption key");
      return;
    }

    setIsDecoding(true);
    setProgress(0);
    setDecodedMessage("");

    try {
      let decoded: string;
      if (isVideoFile(mediaFile)) {
        decoded = await decodeVideo(
          mediaFile,
          key,
          (prog) => setProgress(prog)
        );
      } else {
        decoded = await decodeAudio(
          mediaFile,
          key,
          (prog) => setProgress(prog)
        );
      }
      setDecodedMessage(decoded);
      toast.success("Message decoded successfully! ✨");
    } catch (error: any) {
      console.error("Decoding error:", error);
      toast.error(error.message || "Failed to decode message. Check your key and file.");
      setDecodedMessage("");
    } finally {
      setIsDecoding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 glass-effect">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-accent/20">
            <Unlock className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Decode Message</h2>
            <p className="text-muted-foreground">Extract hidden messages from audio or video files</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Stego Audio (WAV) or Video (MP4, WebM, etc.) File
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept="audio/wav,.wav,video/*,.mp4,.webm,.avi,.mov"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3 p-4 border-2 border-dashed border-accent/30 rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
                  <Upload className="w-5 h-5 text-accent" />
                  <span className="text-foreground">
                    {mediaFile ? mediaFile.name : "Click to upload audio or video file"}
                  </span>
                </div>
              </label>
              {mediaFile && (
                isVideoFile(mediaFile) ? (
                  <FileVideo className="w-6 h-6 text-accent" />
                ) : (
                  <FileAudio className="w-6 h-6 text-accent" />
                )
              )}
            </div>
          </div>

          {/* Key Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Encryption Key
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter the encryption key used to encode..."
              className="w-full p-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter the same key that was used to encode the message
            </p>
          </div>

          {/* Decode Button */}
          <Button
            onClick={handleDecode}
            disabled={isDecoding || !mediaFile || !key.trim()}
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isDecoding ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Decoding... {Math.round(progress * 100)}%
              </>
            ) : (
              <>
                <Unlock className="w-5 h-5 mr-2" />
                Decode Message
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isDecoding && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}

          {/* Decoded Message */}
          {decodedMessage && (
            <Card className="p-6 glass-effect border-accent/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Eye className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">
                  Decoded Message
                </h3>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-accent/20">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {decodedMessage}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-accent/10">
                <span className="text-sm text-muted-foreground">
                  ✓ Message successfully extracted
                </span>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};

