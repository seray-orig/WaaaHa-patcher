import { useCallback, useEffect, useState } from 'react'
import { currentUrl, parseRoute, routeToUrl, type Route } from './routes'

function readLocation(): Route {
  return parseRoute(window.location.pathname, window.location.search)
}

/**
 * Текущий адрес как состояние компонента.
 *
 * Своя замена роутеру: экранов всего три, а библиотека ради трёх экранов потянула бы
 * за собой лишнюю зависимость в приложение, которое работает локально из одного файла.
 */
export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(readLocation)

  useEffect(() => {
    const handlePopState = () => setRoute(readLocation())

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((next: Route) => {
    const url = routeToUrl(next)

    if (currentUrl() !== url) {
      window.history.pushState(null, '', url)
    }

    setRoute(next)
  }, [])

  return [route, navigate]
}
