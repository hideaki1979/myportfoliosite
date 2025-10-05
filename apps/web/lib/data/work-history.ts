type WorkHistoryItem = {
    id: number;
    company: string;
    role: string;
    period: string;
    description: string;
}

export const WORK_HISTORY: WorkHistoryItem[] = [
    {
        id: 1,
        company: '某中小SIer（SES）',
        role: 'システムエンジニア',
        period: '2000/04 - 2011/06',
        description:
            '要件定義〜保守・運用まで幅広く担当。言語はCOBOLをメインにVBやJavaを経験。'
    },
    {
        id: 2,
        company: '某中小SIer（SES）',
        role: 'システムエンジニア',
        period: '2011/10 - 2024/09',
        description:
            '要件定義〜保守・運用まで幅広く担当。言語はCOBOLとJavaに経験。'
    },
];
