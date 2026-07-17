import * as React from 'react';

interface WiredBaseProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  class?: string;
}

interface WiredCardProps extends WiredBaseProps {
  elevation?: number;
}

interface WiredButtonProps extends WiredBaseProps {
  elevation?: number;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

interface WiredInputProps extends WiredBaseProps {
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  type?: string;
}

interface WiredProgressProps extends WiredBaseProps {
  value?: number;
  min?: number;
  max?: number;
  percentage?: boolean;
}

interface WiredCheckboxProps extends WiredBaseProps {
  checked?: boolean;
  disabled?: boolean;
}

interface WiredDialogProps extends WiredBaseProps {
  open?: boolean;
}

interface WiredSliderProps extends WiredBaseProps {
  value?: number;
  min?: number;
  max?: number;
}

interface WiredToggleProps extends WiredBaseProps {
  checked?: boolean;
}

interface WiredSpinnerProps extends WiredBaseProps {
  spinning?: boolean;
}

interface WiredListboxProps extends WiredBaseProps {
  selected?: string;
}

interface WiredItemProps extends WiredBaseProps {
  value?: string;
}

interface WiredDividerProps extends WiredBaseProps {}

interface WiredLinkProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
  elevation?: number;
}

interface WiredTextareaProps extends WiredBaseProps {
  placeholder?: string;
  value?: string;
  rows?: number;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'wired-card': WiredCardProps;
      'wired-button': WiredButtonProps;
      'wired-input': WiredInputProps;
      'wired-progress': WiredProgressProps;
      'wired-checkbox': WiredCheckboxProps;
      'wired-dialog': WiredDialogProps;
      'wired-slider': WiredSliderProps;
      'wired-toggle': WiredToggleProps;
      'wired-spinner': WiredSpinnerProps;
      'wired-listbox': WiredListboxProps;
      'wired-item': WiredItemProps;
      'wired-divider': WiredDividerProps;
      'wired-link': WiredLinkProps;
      'wired-textarea': WiredTextareaProps;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'wired-card': WiredCardProps;
      'wired-button': WiredButtonProps;
      'wired-input': WiredInputProps;
      'wired-progress': WiredProgressProps;
      'wired-checkbox': WiredCheckboxProps;
      'wired-dialog': WiredDialogProps;
      'wired-slider': WiredSliderProps;
      'wired-toggle': WiredToggleProps;
      'wired-spinner': WiredSpinnerProps;
      'wired-listbox': WiredListboxProps;
      'wired-item': WiredItemProps;
      'wired-divider': WiredDividerProps;
      'wired-link': WiredLinkProps;
      'wired-textarea': WiredTextareaProps;
    }
  }
}
