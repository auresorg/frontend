'use client';

import { Button } from '@/components/Button';
import { githubClientId, nextBase } from '@/lib/utils';


export default function Home() {
  return <>

<Button asChild className="mt-4 h-10 w-full">
  <a
    href={`https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(nextBase + "/login/callback")}&scope=read:user user:email`}
  >
    Login with GitHub
  </a>
</Button>


  </>;
}