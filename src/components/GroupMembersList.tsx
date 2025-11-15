import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";

interface GroupMember {
  id: string;
  user_id: string;
  profiles?: {
    display_name: string | null;
  };
}

interface GroupMemberListProps {
  members: GroupMember[];
  exchanges?: Array<{ giver_id: string; viewed_at: string | null }>;
  isDrawn?: boolean;
  maxVisible?: number;
}

export function GroupMembersList({ 
  members = [], 
  exchanges = [], 
  isDrawn = false,
  maxVisible = 5 
}: GroupMemberListProps) {
  const visibleMembers = members.slice(0, maxVisible);
  const hiddenCount = Math.max(0, members.length - maxVisible);

  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const hasViewed = (userId: string) => {
    return exchanges.some(ex => ex.giver_id === userId && ex.viewed_at);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Stacked Avatars */}
      <div className="flex -space-x-3">
        {visibleMembers.map((member, index) => {
          const displayName = member.profiles?.display_name || "Usuario";
          const viewed = isDrawn && hasViewed(member.user_id);
          
          return (
            <div
              key={member.id}
              className="relative transition-transform hover:translate-y-[-2px] hover:z-10"
              style={{ zIndex: maxVisible - index }}
            >
              <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-mint text-secondary-foreground font-semibold text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              {viewed && (
                <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-0.5 border-2 border-background">
                  <span className="text-[10px] text-white">✓</span>
                </div>
              )}
            </div>
          );
        })}
        
        {hiddenCount > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative flex items-center justify-center h-10 w-10 rounded-full border-2 border-background ring-2 ring-primary/20 bg-muted hover:bg-muted/80 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary">
                <span className="text-xs font-semibold text-muted-foreground">
                  +{hiddenCount}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm">
                    Todos los miembros ({members.length})
                  </h4>
                </div>
                <ScrollArea className="h-[300px] pr-3">
                  <div className="space-y-2">
                    {members.map((member) => {
                      const displayName = member.profiles?.display_name || "Usuario";
                      const viewed = isDrawn && hasViewed(member.user_id);
                      
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-mint text-secondary-foreground text-xs font-semibold">
                              {getInitials(displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {displayName}
                            </p>
                          </div>
                          {viewed && (
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs flex-shrink-0">
                              <span className="mr-1">✓</span>
                              Visto
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Member count badge - shown when there are members */}
      {members.length > 0 && (
        <span className="text-sm text-muted-foreground font-medium">
          {members.length} {members.length === 1 ? "miembro" : "miembros"}
        </span>
      )}
    </div>
  );
}
