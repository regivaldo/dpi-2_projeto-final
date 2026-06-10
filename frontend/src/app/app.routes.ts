import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AreaPalestrasLayout } from './pages/area-palestras-layout/area-palestras-layout';
import { Cadastro } from './pages/cadastro/cadastro';
import { Login } from './pages/login/login';
import { CriarPalestra } from './pages/criar-palestra/criar-palestra';
import { MinhasPalestras } from './pages/minhas-palestras/minhas-palestras';
import { PalestraDetalhes } from './pages/palestra-detalhes/palestra-detalhes';
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
    component: AreaPalestrasLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: Palestras,
      },
      {
        path: 'criar',
        component: CriarPalestra,
      },
      {
        path: 'editar/:id',
        component: CriarPalestra,
      },
      {
        path: 'minhas',
        component: MinhasPalestras,
      },
      {
        path: ':id',
        component: PalestraDetalhes,
      },
    ],
  },
];
