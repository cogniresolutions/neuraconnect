import { useState, useEffect } from "react";
import { Bell, BellDot, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  error_message: string | null;
  created_at: string;
  response_time?: number;
  user_id?: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const hasUnread = notifications.length > 0;

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to changes
    const channel = supabase
      .channel('api_monitoring_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_monitoring'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('api_monitoring')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      // Convert the status to the correct type
      const typedNotifications: Notification[] = data.map(notification => ({
        ...notification,
        status: notification.status as 'success' | 'error' | 'pending'
      }));
      setNotifications(typedNotifications);
    }
  };

  const getStatusColor = (status: Notification['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
    }
  };

  const formatEndpoint = (endpoint: string) => {
    return endpoint
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const clearNotifications = async () => {
    const { error } = await supabase
      .from('api_monitoring')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (!error) {
      setNotifications([]);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed right-4 top-4 z-50 rounded-full bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/70"
        >
          {hasUnread ? (
            <BellDot className="h-5 w-5 text-white" />
          ) : (
            <Bell className="h-5 w-5 text-white" />
          )}
          {hasUnread && (
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {notifications.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] bg-gray-900/95 backdrop-blur-lg border-gray-800">
        <SheetHeader className="border-b border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white">Notifications</SheetTitle>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNotifications}
                className="text-gray-400 hover:text-white"
              >
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] py-4">
          {notifications.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start justify-between rounded-lg p-4 transition-colors ${getStatusColor(notification.status)}`}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{formatEndpoint(notification.endpoint)}</p>
                    {notification.error_message && (
                      <p className="text-sm opacity-70">
                        {notification.error_message}
                      </p>
                    )}
                    <p className="text-xs opacity-50">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-8 w-8 shrink-0"
                    onClick={() => {
                      const updatedNotifications = notifications.filter(
                        n => n.id !== notification.id
                      );
                      setNotifications(updatedNotifications);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
