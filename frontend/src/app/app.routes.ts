import { Routes } from '@angular/router';
import { Cadastro } from './pages/cadastro/cadastro';
import { Login } from './pages/login/login';

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
];
