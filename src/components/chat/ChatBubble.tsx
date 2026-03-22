import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatBubbleProps {
  content: string;
  timestamp: string;
  isSender: boolean;
}

export function ChatBubble({ content, timestamp, isSender }: ChatBubbleProps) {
  return (
    <div className={cn("flex", isSender ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
          isSender
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <p className="whitespace-pre-line break-words">{content}</p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isSender ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {format(new Date(timestamp), "h:mm a")}
        </p>
      </div>
    </div>
  );
}
