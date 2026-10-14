import { useCallback } from 'react'
import { LoadingScreen } from './components/Common'
import { useGameData } from './hooks/useGameData'
import { EditorPage } from './pages/EditorPage'
import { ProfilesPage } from './pages/ProfilesPage'
import { SetsPage } from './pages/SetsPage'
import { useRoute } from './routing/useRoute'

/**
 * Навигация целиком живёт в адресной строке.
 *
 * Раньше экран хранился в состоянии, и перезагрузка страницы возвращала на главное
 * меню: открытый набор приходилось искать заново. Теперь адрес вида
 * /profiles/Profile1/MY_HOTKEYS.LUA восстанавливает ровно тот же экран.
 */
export default function App() {
  const [route, navigate] = useRoute()
  const game = useGameData()

  const profile =
    route.name === 'profiles'
      ? null
      : (game.profiles.find((item) => item.name === route.profileName) ?? null)

  const openSets = useCallback(
    (profileName: string) => navigate({ name: 'sets', profileName, creating: false }),
    [navigate],
  )

  // Профиль из адреса ещё ищется. Показывать главную раньше времени нельзя: мигнёт
  // списком и вернёт назад, будто игрок потерялся.
  if (route.name !== 'profiles' && profile === null && game.loading) {
    return <LoadingScreen />
  }

  // Профиля с таким именем нет — например, папку игры перенесли. На главной можно
  // выбрать другой.
  if (route.name === 'profiles' || profile === null) {
    return <ProfilesPage game={game} onSelect={openSets} />
  }

  if (route.name === 'sets') {
    return (
      <SetsPage
        profile={profile}
        creating={route.creating}
        onBack={() => navigate({ name: 'profiles' })}
        onCreate={() => navigate({ name: 'sets', profileName: profile.name, creating: true })}
        onCancelCreate={() => navigate({ name: 'sets', profileName: profile.name, creating: false })}
        onOpen={(fileName) => navigate({ name: 'editor', profileName: profile.name, fileName })}
      />
    )
  }

  return (
    <EditorPage
      key={`${profile.name}/${route.fileName}`}
      profile={profile}
      fileName={route.fileName}
      onBack={() => openSets(profile.name)}
      onDuplicate={() => navigate({ name: 'sets', profileName: profile.name, creating: true })}
    />
  )
}
