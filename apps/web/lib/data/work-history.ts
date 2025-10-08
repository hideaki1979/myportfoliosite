type WorkHistoryItem = {
    id: number;
    company: string;
    role: string;
    period: string;
    description: string;
    devProcess: string;
    devProgram: string;
    devMethod: string;
    AI: string;
}

export const WORK_HISTORY: WorkHistoryItem[] = [
    {
        id: 1,
        company: '某中小SIer（SES）',
        role: 'システムエンジニア',
        period: '2000/04 - 2011/06',
        description:
            '要件定義〜保守・運用まで幅広く担当。言語はCOBOLをメインにVBやJavaを経験。',
        devProcess: '要件定義・設計・開発・テスト・本番稼働・保守',
        devProgram: 'COBOL、Java、VB、Perlなど。Eclipse',
        devMethod: 'ウォーターフォール',
        AI: "-",
    },
    {
        id: 2,
        company: '某中小SIer（SES）',
        role: 'システムエンジニア',
        period: '2011/10 - 2024/09',
        description:
            '要件定義〜保守・運用まで幅広く担当。言語はCOBOLとJavaに経験。',
        devProcess: '要件定義・設計・開発・テスト・本番稼働・保守',
        devProgram: 'COBOL、Java、VB、Perlなど。Eclipse',
        devMethod: 'ウォーターフォール、アジャイル、スクラム',
        AI: "-",
    },
    {
        id: 3,
        company: "G'sアカデミー〜自己学習",
        role: '−',
        period: '2024/10 - 2025/04',
        description:
            "G'sでは、週2回の課題作成をしながらモダンWeb技術習得を学習。\n 卒業後は、React、Next.jsのフロントエンドを中心にGoやNode.js（Express）、NestJSも学習",
        devProcess: '設計・開発・テスト・デプロイ',
        devProgram:
            'HTML、CSS、JavaScript、PHP、Laravel、React、Swift、Next.js、ReactNative、 \n Node.js（Express）、NestJS。Visual Studio Code、Cursor',
        devMethod: '−',
        AI: "Github Copilot, Cursor, Gemini CLI, Claude Code, Code Rabbit, Gemini Code Assist",
    },
];
