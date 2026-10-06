// SPDX-License-Identifier: AGPL-3.0-or-later
// web's form pieces (web/src/components/ui.tsx), sized for fingers.

import { Check, ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react-native'
import { type ReactNode, forwardRef, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, type PressableProps, ScrollView, Switch, Text, TextInput, type TextInputProps, View } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { haptic } from '../../modules/haptics'
import { Squircle } from '../effects/Squircle'
import { useMotion } from '../effects/motion'
import { useTheme } from '../theme/ThemeProvider'
import { lift } from '../theme/materials'
import { Sheet } from './Sheet'

type Variant = 'primary' | 'quiet' | 'plain' | 'danger' | 'danger-solid'

const variants: Record<Variant, { idle: string; pressed: string; text: string }> = {
  primary: { idle: 'bg-accent', pressed: 'bg-accent-hover', text: 'text-on-accent' },
  quiet: { idle: 'bg-panel', pressed: 'bg-float', text: 'text-ink' },
  plain: { idle: '', pressed: 'bg-press', text: 'text-ink-2' },
  danger: { idle: '', pressed: 'bg-danger/15', text: 'text-danger' },
  'danger-solid': { idle: 'bg-danger', pressed: 'bg-danger/80', text: 'text-canvas' },
}

const sizes = {
  sm: { box: 'h-9 px-3 gap-1.5', text: 'text-[13px]', radius: 9 },
  md: { box: 'h-10 px-4 gap-2', text: 'text-sm', radius: 10 },
  lg: { box: 'h-12 px-5 gap-2.5', text: 'text-[15px] font-medium', radius: 14 },
}

export function Button({
  variant = 'quiet',
  size = 'md',
  icon,
  children,
  disabled,
  onPress,
  className = '',
  ...rest
}: Omit<PressableProps, 'children'> & {
  variant?: Variant
  size?: keyof typeof sizes
  icon?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const v = variants[variant]
  const s = sizes[size]
  return (
    <Pressable
      disabled={disabled}
      onPress={(e) => {
        haptic('press')
        onPress?.(e)
      }}
      className={className}
      style={{ opacity: disabled ? 0.4 : 1 }}
      {...rest}
    >
      {({ pressed }) => (
        <Squircle radius={s.radius} edge={variant === 'quiet'} className={`flex-row items-center justify-center ${s.box} ${pressed ? v.pressed : v.idle}`}>
          {icon}
          {typeof children === 'string' ? <Text className={`font-sans ${s.text} ${v.text}`}>{children}</Text> : children}
        </Squircle>
      )}
    </Pressable>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <View>
      <Text className="font-sans mb-1.5 text-[13px] text-ink-2">{label}</Text>
      {children}
      {hint && <Text className="font-sans mt-1.5 text-xs leading-relaxed text-ink-3">{hint}</Text>}
    </View>
  )
}

export const Input = forwardRef<TextInput, TextInputProps>(function Input({ style, ...rest }, ref) {
  const { tokens } = useTheme()
  return (
    <Squircle radius={10} edge className="bg-raised">
      <TextInput
        ref={ref}
        placeholderTextColor={tokens['ink-3']}
        selectionColor={tokens.accent}
        cursorColor={tokens.ink}
        style={[{ height: 46, paddingHorizontal: 14, color: tokens.ink, fontFamily: 'Geist', fontSize: 15 }, style]}
        {...rest}
      />
    </Squircle>
  )
})

/** A floating layer: squircle panel, lit edge, deep shadow. */
export function Panel({ radius = 20, className = '', children }: { radius?: number; className?: string; children: ReactNode }) {
  const { style, tokens, material } = useTheme()
  const shadow = lift(style, tokens)
  return (
    <View style={shadow ? { boxShadow: shadow, borderRadius: Math.round(radius * material.corners.scale) } : undefined}>
      <Squircle radius={radius} edge className={`bg-float ${className}`}>
        {children}
      </Squircle>
    </View>
  )
}

export function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  const { tokens } = useTheme()
  return <ActivityIndicator size={size} color={tokens['ink-2']} />
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <Text className="font-sans text-sm text-danger">{children}</Text>
}

/** A round button holding just an icon. */
export function IconButton({
  label,
  onPress,
  disabled,
  children,
  size = 40,
  tone = 'plain',
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  children: ReactNode
  size?: number
  tone?: 'plain' | 'raised'
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      disabled={disabled}
      onPress={() => {
        haptic('press')
        onPress()
      }}
      style={{ opacity: disabled ? 0.35 : 1 }}
    >
      {({ pressed }) => (
        <Squircle
          radius={size / 2.6}
          className={pressed ? 'bg-press' : tone === 'raised' ? 'bg-raised' : ''}
          style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
        >
          {children}
        </Squircle>
      )}
    </Pressable>
  )
}

export type Option<T> = { value: T; label: string }

/** web's Segmented: a row of choices with the picked one raised. */
export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: Option<T>[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  const scroll = options.length > 3
  const row = (
    <Squircle radius={12} className="flex-row bg-raised p-1" style={scroll ? undefined : { alignSelf: 'stretch' }}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <Pressable
            key={o.value}
            style={scroll ? undefined : { flexGrow: 1 }}
            onPress={() => {
              if (on) return
              haptic('tick')
              onChange(o.value)
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Squircle
              radius={9}
              edge={on}
              className={on ? 'bg-float' : ''}
              style={{ paddingVertical: size === 'sm' ? 6 : 8, paddingHorizontal: 12, alignItems: 'center' }}
            >
              <Text className={`font-sans ${size === 'sm' ? 'text-[13px]' : 'text-sm'} font-medium ${on ? 'text-ink' : 'text-ink-2'}`} numberOfLines={1}>
                {o.label}
              </Text>
            </Squircle>
          </Pressable>
        )
      })}
    </Squircle>
  )
  if (!scroll) return row
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
      {row}
    </ScrollView>
  )
}

/** A switch in the theme's colours, with the toggle haptics. */
export function Toggle({ value, onChange, label, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  const { tokens } = useTheme()
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      disabled={disabled}
      trackColor={{ true: tokens.accent, false: tokens.press }}
      thumbColor={value ? tokens['on-accent'] : tokens['ink-2']}
      onValueChange={(on) => {
        haptic(on ? 'toggleOn' : 'toggleOff')
        onChange(on)
      }}
    />
  )
}

/** A choice that opens a sheet of its options (web's Select). */
export function Select<T extends string>({
  value,
  options,
  onChange,
  title,
  placeholder = 'Choose…',
}: {
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  title?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const { tokens } = useTheme()
  const current = options.find((o) => o.value === value)
  return (
    <>
      <Pressable
        onPress={() => {
          haptic('press')
          setOpen(true)
        }}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {({ pressed }) => (
          <Squircle radius={10} edge className={pressed ? 'bg-press' : 'bg-raised'} style={{ height: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text className={`font-sans flex-1 text-[15px] ${current ? 'text-ink' : 'text-ink-3'}`} numberOfLines={1}>
              {current?.label ?? placeholder}
            </Text>
            <ChevronDown size={16} color={tokens['ink-3']} />
          </Squircle>
        )}
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)}>
        {title && <Text className="font-sans mb-2 mt-1 text-lg font-semibold text-ink">{title}</Text>}
        <ScrollView style={{ maxHeight: 420 }}>
          {options.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => {
                haptic('tick')
                setOpen(false)
                if (o.value !== value) onChange(o.value)
              }}
            >
              {({ pressed }) => (
                <Squircle radius={12} className={pressed ? 'bg-press' : ''} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 13, gap: 10 }}>
                  <Text className={`font-sans flex-1 text-[15px] ${o.value === value ? 'font-medium text-ink' : 'text-ink-2'}`}>{o.label}</Text>
                  {o.value === value && <Check size={18} color={tokens.ink} />}
                </Squircle>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
    </>
  )
}

export type Tone = 'quiet' | 'ok' | 'live' | 'warn' | 'danger' | 'strong'

const badgeTones: Record<Tone, { box: string; text: string }> = {
  quiet: { box: 'bg-panel', text: 'text-ink-2' },
  ok: { box: 'bg-ok/15', text: 'text-ok' },
  live: { box: 'bg-info/15', text: 'text-info' },
  warn: { box: 'bg-warn/15', text: 'text-warn' },
  danger: { box: 'bg-danger/15', text: 'text-danger' },
  strong: { box: 'bg-ink', text: 'text-canvas' },
}

export function Badge({ tone = 'quiet', icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  const t = badgeTones[tone]
  return (
    <View className={`flex-row items-center gap-1 rounded-md px-1.5 py-0.5 ${t.box}`}>
      {icon}
      <Text className={`font-sans text-2xs font-medium ${t.text}`} numberOfLines={1}>
        {children}
      </Text>
    </View>
  )
}

/** A thin bar, filled `value` (0–1) of the way, gliding as it changes. */
export function Progress({ value, tone = 'live', duration = 600 }: { value: number; tone?: 'live' | 'ok' | 'quiet' | 'ink'; duration?: number }) {
  const fill = { live: 'bg-info', ok: 'bg-ok', quiet: 'bg-ink-3', ink: 'bg-ink' }[tone]
  const style = useAnimatedStyle(() => ({ width: withTiming(`${Math.max(0, Math.min(1, value)) * 100}%`, { duration }) }), [value, duration])
  return (
    <View className="h-1 overflow-hidden rounded-full bg-press">
      <Animated.View className={`h-full rounded-full ${fill}`} style={style} />
    </View>
  )
}

/** A filter or a pick among a few (web's Chip). */
export function Chip({ on, onPress, children, soft }: { on: boolean; onPress: () => void; children: ReactNode; soft?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        haptic('tick')
        onPress()
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Squircle radius={9} className={on ? (soft ? 'bg-ink/75' : 'bg-ink') : 'bg-raised'} style={{ height: 34, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {typeof children === 'string' ? <Text className={`font-sans text-[13px] font-medium ${on ? 'text-canvas' : 'text-ink-2'}`}>{children}</Text> : children}
      </Squircle>
    </Pressable>
  )
}

/** A number, where 0 (shown as ∞) is no limit. */
export function Stepper({ value, onChange, step = 1, max = 999, label }: { value: number; onChange: (n: number) => void; step?: number; max?: number; label: string }) {
  const { tokens } = useTheme()
  const [text, setText] = useState(String(value || ''))
  useEffect(() => setText(String(value || '')), [value])
  const set = (n: number) => {
    const next = Math.max(0, Math.min(max, n))
    if (next === value) return
    haptic(next === 0 || next === max ? 'edge' : 'tick')
    onChange(next)
  }
  const commit = () => {
    const n = Math.max(0, Math.min(max, Number.parseInt(text, 10) || 0))
    if (n !== value) onChange(n)
    else setText(String(value || ''))
  }
  return (
    <Squircle radius={10} edge className="bg-raised" style={{ height: 38, flexDirection: 'row', alignItems: 'center' }}>
      <Pressable accessibilityLabel="Fewer" hitSlop={4} onPress={() => set(value - step)} disabled={value === 0} style={{ width: 36, alignItems: 'center', opacity: value === 0 ? 0.3 : 1 }}>
        <Minus size={16} color={tokens['ink-2']} />
      </Pressable>
      <TextInput
        accessibilityLabel={label}
        value={text}
        placeholder="∞"
        keyboardType="number-pad"
        placeholderTextColor={tokens['ink-3']}
        onChangeText={(t) => setText(t.replace(/\D/g, ''))}
        onBlur={commit}
        onSubmitEditing={commit}
        style={{ width: 48, textAlign: 'center', color: tokens.ink, fontFamily: 'Geist', fontSize: 15, padding: 0 }}
      />
      <Pressable accessibilityLabel="More" hitSlop={4} onPress={() => set(value + step)} style={{ width: 36, alignItems: 'center' }}>
        <Plus size={16} color={tokens['ink-2']} />
      </Pressable>
    </Squircle>
  )
}

export function Checkbox({ checked }: { checked: boolean }) {
  const { tokens } = useTheme()
  return (
    <Squircle radius={6} className={checked ? 'bg-ink' : 'bg-panel'} edge={!checked} style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      {checked && <Check size={15} color={tokens.canvas} strokeWidth={3} />}
    </Squircle>
  )
}

/** Nothing to show, said plainly (web's Empty). */
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  const motion = useMotion()
  return (
    <Animated.View style={motion.fade} className="items-center px-6 py-20">
      <Text className="font-sans text-center text-[15px] font-medium text-ink">{title}</Text>
      {typeof children === 'string' ? <Text className="font-sans mt-2 text-center text-sm leading-5 text-ink-2">{children}</Text> : children}
    </Animated.View>
  )
}

/** A titled group of rows, like a settings card. */
export function Group({ title, description, aside, children, className = '' }: { title?: string; description?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <View className={className}>
      {(title || aside) && (
        <View className="mb-2 flex-row items-end gap-3 px-1">
          <View className="flex-1">
            {title && <Text className="font-sans text-xs font-medium uppercase tracking-wider text-ink-3">{title}</Text>}
          </View>
          {aside}
        </View>
      )}
      <Squircle radius={16} edge className="bg-raised" style={{ paddingVertical: 4 }}>
        {children}
      </Squircle>
      {description ? (
        typeof description === 'string' ? (
          <Text className="font-sans mt-2 px-1 text-xs leading-4 text-ink-3">{description}</Text>
        ) : (
          <View className="mt-2 px-1">{description}</View>
        )
      ) : null}
    </View>
  )
}

/** One line in a Group: an icon, a label and its hint, and something at the end (a switch, a value, a chevron). */
export function ListRow({
  icon,
  label,
  hint,
  value,
  right,
  onPress,
  onLongPress,
  danger,
  chevron = !!onPress && !right,
  children,
}: {
  icon?: ReactNode
  label: ReactNode
  hint?: ReactNode
  value?: string
  right?: ReactNode
  onPress?: () => void
  onLongPress?: () => void
  danger?: boolean
  chevron?: boolean
  children?: ReactNode
}) {
  const { tokens } = useTheme()
  const body = (pressed: boolean) => (
    <View className={`flex-row items-center gap-3 px-4 py-3 ${pressed ? 'bg-press' : ''}`} style={{ minHeight: 52 }}>
      {icon && <View style={{ width: 22, alignItems: 'center' }}>{icon}</View>}
      <View className="min-w-0 flex-1">
        {typeof label === 'string' ? (
          <Text className={`font-sans text-[15px] ${danger ? 'text-danger' : 'text-ink'}`} numberOfLines={1}>
            {label}
          </Text>
        ) : (
          label
        )}
        {hint ? (
          typeof hint === 'string' ? (
            <Text className="font-sans mt-0.5 text-xs leading-4 text-ink-3" numberOfLines={3}>
              {hint}
            </Text>
          ) : (
            hint
          )
        ) : null}
        {children}
      </View>
      {value ? (
        <Text className="font-sans max-w-[45%] text-sm text-ink-3" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {chevron && <ChevronRight size={18} color={tokens['ink-3']} />}
    </View>
  )
  if (!onPress && !onLongPress) return body(false)
  return (
    <Pressable
      onPress={
        onPress &&
        (() => {
          haptic('press')
          onPress()
        })
      }
      onLongPress={
        onLongPress &&
        (() => {
          haptic('longPressOpen')
          onLongPress()
        })
      }
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  )
}

/** A hairline between rows in a Group. */
export function Divider({ inset = 16 }: { inset?: number }) {
  return <View className="h-px bg-line" style={{ marginLeft: inset }} />
}
