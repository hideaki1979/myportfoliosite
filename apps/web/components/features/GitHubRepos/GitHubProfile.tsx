'use client'

import styled from "styled-components"
import type { GitHubProfile as GitHubProfileType } from "./types";
import Image from "next/image";

const ProfileContainer = styled.div`
  position: relative;
  background-color: #dddddd;
  box-shadow: 2px 2px 4px 0px rgba(0, 0, 0, 0.25);
  padding: 20px;
  border-radius: 4px;
  display: flex;
  gap: 20px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ProfileImageWrapper = styled.div`
  position: relative;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 13px;
  flex: 1;
`;

const DisplayName = styled.h3`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 1.1;
  color: #000;
  margin: 0;
`;

const ProfileUrl = styled.a`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 1.1;
  color: #4a4a4a;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #0070f3;
  }
`;

const Bio = styled.p`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.6;
  color: #000;
  margin: 0;
  white-space: pre-line;
`;

interface GitHubProfileProps {
  profile: GitHubProfileType;
}

export default function GitHubProfile({ profile }: GitHubProfileProps) {
  return (
    <ProfileContainer>
      <ProfileImageWrapper>
        <Image
          src={profile.avatarUrl}
          alt={profile.displayName}
          width={88}
          height={88}
          style={{ objectFit: 'cover' }}
          priority
        />
      </ProfileImageWrapper>
      <ProfileInfo>
        <DisplayName>{profile.displayName}</DisplayName>
        <ProfileUrl
          href={profile.profileUrl}
          target="_blank"
          rel='noopener noreferrer'
        >
          {profile.profileUrl}
        </ProfileUrl>
        <Bio>{profile.bio}</Bio>
      </ProfileInfo>
    </ProfileContainer>
  );
}

