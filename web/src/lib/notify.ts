// SPDX-License-Identifier: AGPL-3.0-or-later
// Whether to show system notifications for new episodes, per browser.

const KEY = 'tinystream.notify'

export function notifyEnabled() {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted' && localStorage.getItem(KEY) !== 'off'
}

export async function setNotify(on: boolean): Promise<boolean> {
  if (!on) {
    localStorage.setItem(KEY, 'off')
    return false
  }
  if (typeof Notification === 'undefined') return false
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  localStorage.setItem(KEY, permission === 'granted' ? 'on' : 'off')
  return permission === 'granted'
}
