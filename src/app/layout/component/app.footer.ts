import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        Solution by
        <a href="https://zahed.dev/" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Zahed</a>
    </div>`
})
export class AppFooter {}
