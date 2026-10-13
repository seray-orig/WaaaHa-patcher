import { useState } from 'react'
import type { ProfileInfo } from './api/types'
import { EditorPage } from './pages/EditorPage'
import { ProfilesPage } from './pages/ProfilesPage'
import { SetsPage } from './pages/SetsPage'

type Route =
  | { name: 'profiles' }
  | { name: 'sets'; profile: ProfileInfo }
  | { name: 'editor'; profile: ProfileInfo; fileName: string }

/**
 * Роутинг держим в состоянии: приложение работает локально, страниц можно ровно три,
 * а react-router ради этого не нужен.
 */
export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'profiles' })

  switch (route.name) {
    case 'profiles':
      return (
        <ProfilesPage
          onSelect={(profile) => setRoute({ name: 'sets', profile })}
        />
      )

    case 'sets':
      return (
        <SetsPage
          profile={route.profile}
          onBack={() => setRoute({ name: 'profiles' })}
          onOpen={(fileName) =>
            setRoute({ name: 'editor', profile: route.profile, fileName })
          }
        />
      )

    case 'editor':
      return (
        <EditorPage
          key={`${route.profile.name}/${route.fileName}`}
          profile={route.profile}
          fileName={route.fileName}
          onBack={() => setRoute({ name: 'sets', profile: route.profile })}
          onDuplicate={() => setRoute({ name: 'sets', profile: route.profile })}
        />
      )
  }
}