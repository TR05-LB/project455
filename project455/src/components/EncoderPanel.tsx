import { useState } from "react";
import { Upload, Lock, FileAudio, FileVideo, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { encodeAudio, encodeVideo, isVideoFile, isAudioFile } from "@/lib/steganography";

export const EncoderPanel = () => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [key, setKey] = useState("");
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [encodedBlob, setEncodedBlob] = useState<Blob | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isAudioFile(file) && !isVideoFile(file)) {
        toast.error("Please select an audio (WAV) or video (MP4, WebM, etc.) file");
        return;
      }
      setMediaFile(file);
      const fileType = isVideoFile(file) ? "Video" : "Audio";
      toast.success(`${fileType} file selected`);
    }
  };

  const handleEncode = async () => {
    if (!mediaFile) {
      toast.error("Please select an audio or video file");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message to encode");
      return;
    }
    if (!key.trim()) {
      toast.error("Please enter an encryption key");
      return;
    }

    setIsEncoding(true);
    setProgress(0);
    setEncodedBlob(null);

    try {
      let encoded: Blob;
      if (isVideoFile(mediaFile)) {
        encoded = await encodeVideo(
          mediaFile,
          message,
          key,
          (prog) => setProgress(prog)
        );
      } else {
        encoded = await encodeAudio(
          mediaFile,
          message,
          key,
          (prog) => setProgress(prog)
        );
      }
      setEncodedBlob(encoded);
      toast.success("Message encoded successfully! ✨");
    } catch (error: any) {
      console.error("Encoding error:", error);
      toast.error(error.message || "Failed to encode message");
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDownload = () => {
    if (!encodedBlob || !mediaFile) return;
    const url = URL.createObjectURL(encodedBlob);
    const a = document.createElement("a");
    a.href = url;
    const extension = isVideoFile(mediaFile) ? ".webm" : ".wav";
    const originalName = mediaFile.name.split(".")[0];
    a.download = `stego_${originalName}${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Encoded file downloaded!");
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 glass-effect">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-primary/20">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Encode Message</h2>
            <p className="text-muted-foreground">Hide your secret message in an audio or video file</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Audio (WAV) or Video (MP4, WebM, etc.) File
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept="audio/wav,.wav,video/*,.mp4,.webm,.avi,.mov"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3 p-4 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-5 h-5 text-primary" />
                  <span className="text-foreground">
                    {mediaFile ? mediaFile.name : "Click to upload audio or video file"}
                  </span>
                </div>
              </label>
              {mediaFile && (
                isVideoFile(mediaFile) ? (
                  <FileVideo className="w-6 h-6 text-primary" />
                ) : (
                  <FileAudio className="w-6 h-6 text-primary" />
                )
              )}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Secret Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the message you want to hide..."
              className="w-full p-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {message.length} characters
            </p>
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
              placeholder="Enter encryption key..."
              className="w-full p-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Keep this key safe! You'll need it to decode the message.
            </p>
          </div>

          {/* Encode Button */}
          <Button
            onClick={handleEncode}
            disabled={isEncoding || !mediaFile || !message.trim() || !key.trim()}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isEncoding ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Encoding... {Math.round(progress * 100)}%
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Encode Message
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isEncoding && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}

          {/* Download Button */}
          {encodedBlob && (
            <Card className="p-6 glass-effect border-primary/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Encoding Complete!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your message has been hidden in the {mediaFile && isVideoFile(mediaFile) ? "video" : "audio"} file
                  </p>
                </div>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};

