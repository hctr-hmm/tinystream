// SPDX-License-Identifier: AGPL-3.0-or-later
// web's form pieces (web/src/components/ui.tsx), sized for fingers.

import { type ReactNode, forwardRef } from 'react'
import { ActivityIndicator, Pressable, type PressableProps, Text, TextInput, type TextInputProps, View } from 'react-native'
import { haptic } from '../../modules/haptics'
import { Squircle } from '../effects/Squircle'
import { useTheme } from '../theme/ThemeProvider'
import { lift } from '../theme/materials'

type Variant = 'primary' | 'quiet' | 'plain' | 'danger'

const variants: Record<Variant, { idle: string; pressed: string; text: string }> = {
  primary: { idle: 'bg-accent', pressed: 'bg-accent-hover', text: 'text-on-accent' },
  quiet: { idle: 'bg-panel', pressed: 'bg-float', text: 'text-ink' },
  plain: { idle: '', pressed: 'bg-press', text: 'text-ink-2' },
  danger: { idle: '', pressed: 'bg-danger/15', text: 'text-danger' },
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
