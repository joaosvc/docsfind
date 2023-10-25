import Menu from './header/menu'
import Logo from './header/logo'

export default function Header() {
  return (
    <>
      <header className="flex p-2 justify-center border shadow-md">
        <div className="flex flex-row items-center justify-between w-10/12 h-9">
          <Logo />
          <Menu />
        </div>
      </header>
    </>
  )
}
