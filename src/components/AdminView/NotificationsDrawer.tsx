import React, { useState, useEffect } from 'react';
import { SystemNotification } from '../../types';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Package,
  Bike,
  ShieldAlert,
  X,
  Clock,
  ExternalLink
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectOrder
}) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifs();
    }
  }, [isOpen, roleFilter]);

  const loadNotifs = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications(roleFilter);
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'STOCK_ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'CLAIM_CREATED':
      case 'CLAIM_MESSAGE':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'ORDER_CREATED':
      case 'ORDER_CANCELLED':
        return <Package className="w-4 h-4 text-purple-500" />;
      case 'DRIVER_ASSIGNED':
        return <Bike className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-stone-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Centre de Notifications</h3>
              <div className="text-[11px] text-stone-500">
                {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Toutes les alertes sont lues'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="p-1.5 text-stone-500 hover:text-purple-700 text-xs font-semibold rounded-lg hover:bg-stone-200 transition"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Role Filters */}
        <div className="p-2 border-b border-stone-200 flex items-center gap-1 text-[11px] overflow-x-auto">
          {['all', 'admin', 'kitchen', 'driver', 'client'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded-lg font-bold capitalize whitespace-nowrap transition ${
                roleFilter === r
                  ? 'bg-purple-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {r === 'all' ? 'Toutes' : r}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-400">
              Aucune notification pour le moment.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) handleMarkRead(n.id);
                  if (n.metadata?.orderId && onSelectOrder) {
                    onSelectOrder(n.metadata.orderId);
                    onClose();
                  }
                }}
                className={`p-4 transition cursor-pointer flex items-start gap-3 ${
                  n.read ? 'bg-white hover:bg-stone-50' : 'bg-purple-50/40 hover:bg-purple-50/70 border-l-4 border-purple-600'
                }`}
              >
                <div className="p-2 rounded-xl bg-white border border-stone-200 shadow-xs mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-stone-900 text-xs leading-snug">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.createdAt).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className="font-semibold uppercase tracking-wider">{n.targetRole}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
