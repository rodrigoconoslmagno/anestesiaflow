import { type MenuItem } from '@/componentes/menu/navigation';
import type { Permissoes } from '@/permissoes/permissoes';
import type { Recurso } from '@/permissoes/recurso';

export const buildDynamicMenu = (permissoes: Permissoes[]): MenuItem[] => {
    const menu: MenuItem[] = [{ 
        label: 'Início', 
        icon: 'pi pi-home', 
        to: '/dashboard' 
    }];

    const itensDeMenu = permissoes.filter(p => p.exibirNoMenu);

    itensDeMenu.forEach(perm => {
        const caminhos = perm.modulo.split('|');
        let nivelAtual = menu;

        caminhos.forEach((nomeModulo, index) => {
            let itemExistente = nivelAtual.find(item => item.label === nomeModulo);

            if (!itemExistente) {
                itemExistente = {
                    label: nomeModulo,
                    icon: index === 0 ? 'pi pi-folder' : 'pi pi-circle',
                    children: []
                };
                nivelAtual.push(itemExistente);
            }

            if (!itemExistente.children) {
                itemExistente.children = [];
            }

            if (index === caminhos.length - 1) {
                nivelAtual = itemExistente.children;

                const recursoEncontrado = perm.id ? (perm.id.split('_')[0] as Recurso) : undefined;

                nivelAtual.push({
                    label: perm.descricao,
                    icon: perm.icone,
                    to: perm.rota,
                    recurso: recursoEncontrado
                });
            } else {
                nivelAtual = itemExistente.children;
            }
        });
    });

    return menu;
};