// Declaraciones de tipos para módulos sin tipos
declare module 'formik' {
  export interface FormikProps<Values> {
    values: Values;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    isSubmitting: boolean;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleBlur: (e: React.FocusEvent<any>) => void;
    setFieldValue: (field: string, value: any) => void;
    setTouched: (fields: Record<string, boolean>) => void;
    validateForm: () => Promise<any>;
  }
  
  export function Formik<Values>(props: any): JSX.Element;
  export function Form(props: any): JSX.Element;
}

declare module 'yup' {
  export function object(schema: any): any;
  export function string(): any;
  export function number(): any;
  export function array(): any;
  export function mixed(): any;
}

declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: any;
}

declare module 'lucide-react' {
  interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  
  export const AlertCircle: React.FC<IconProps>;
  export const Info: React.FC<IconProps>;
  // Add any other icons you might use
}

declare module 'next-themes' {
  export function useTheme(): { theme: string | undefined; setTheme: (theme: string) => void };
} 