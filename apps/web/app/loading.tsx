import { SkeletonLoader as GitHubSkeletonLoader } from "../components/features/GitHubRepos";

export default function Loading() {
    return (
        <div style={{padding: '24px'}}>
            <GitHubSkeletonLoader count={6} showProfile={true} showBar={true} />
        </div>
    )
}
