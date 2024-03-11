import logo from "./img/new_logo.png"
export default function Header() {
    return (
      <div className={"header"}>
        <a href={"https://idir.uta.edu"}>
          <img src={logo} width={128}/>
        </a>
      </div>
    );
}

