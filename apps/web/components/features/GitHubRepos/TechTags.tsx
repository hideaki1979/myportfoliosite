'use client'

import styled from "styled-components"

const Container = styled.div`
  border: 2px solid #adadad;
  padding: 16px;
  background-color: #fff;
  border-radius: 4px;
`;

const Title = styled.h3`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 1;
  color: #000;
  margin: 0 0 16px 0;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const Tag = styled.span`
  background-color: #dddddd;
  padding: 8px 16px;
  border-radius: 10px;
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.1;
  color: #000;
  white-space: nowrap;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c0c0c0;
  }
`;

interface TechTagsProps {
    tags: string[];
    title?: string;
}

export default function TechTags({ tags, title = 'Tags' }: TechTagsProps) {
    if (tags.length === 0) {
        return null;
    }

    return (
        <Container>
            <Title>{title}</Title>
            <TagsContainer role="list" aria-label="技術タグ一覧">
                {tags.map((tag) => (
                    <Tag key={tag} role="listitem">
                        {tag}
                    </Tag>
                ))}
            </TagsContainer>
        </Container>
    );
}


