import 'styled-components';
import type { AppTheme } from '../styles/theme';

declare module 'styled-components' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface DefaultTheme extends AppTheme { }
}



