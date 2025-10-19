'use client'

import styled from "styled-components"
import { QiitaUser } from "../../../lib/api/qiita";

const ProfileContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 24px;
    background-color: #dddddd;
    box-shadow: 2px 2px 4px 0px rgba(0, 0, 0, 0.25);
`;

const AvatarWrapper = styled.div`
    flex-shrink: 0;
`;

const Avator = styled.img`
    width: 88px;
    height: 88px;
    border-radius: 50%;
    object-fit: cover;
`;

const ProfileInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
`;

const Username = styled.a`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 700;
    font-size: 18px;
    line-height: 1.5;
    color: #000000;
    transition: color 0.3s;

    &:hover {
        color: #55c500;
    }
`;

const ProfileUrl = styled.a`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 700;
    font-size: 14px;
    line-height: 1.5;
    color: #868686;

    transition: color 0.2s;

    &:hover {
        color: #55c500;
    }
`;

const Description = styled.p`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.1;
    color: #000000;
`;

interface QiitaProfileProps {
    profile: QiitaUser;
}

export default function QiitaProfile({ profile }: QiitaProfileProps) {
    const profileUrl = `https://qiita.com/${profile.id}`;

    return (
        <ProfileContainer>
            <AvatarWrapper>
                <Avator
                    src={profile.profileImageUrl}
                    alt={`${profile.name}のプロフィール画像`}
                />
            </AvatarWrapper>
            <ProfileInfo>
                <Username
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    @{profile.id}
                </Username>
                <ProfileUrl
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {profileUrl}
                </ProfileUrl>
                <Description>{profile.description}</Description>
            </ProfileInfo>
        </ProfileContainer>
    );
}

