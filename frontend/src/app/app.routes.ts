import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { Cadastro } from './pages/cadastro/cadastro';
import { Login } from './pages/login/login';
import { CriarPalestra } from './pages/criar-palestra/criar-palestra';
import { MinhasPalestras } from './pages/minhas-palestras/minhas-palestras';
import { Palestras } from './pages/palestras/palestras';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'cadastro',
    component: Cadastro,
  },
  {
    path: 'palestras',
    component: Palestras,
    canActivate: [authGuard],
  },
  {
    path: 'palestras/criar',
    component: CriarPalestra,
    canActivate: [authGuard],
  },
  {
    path: 'palestras/minhas',
    component: MinhasPalestras,
    canActivate: [authGuard],
  },
];
