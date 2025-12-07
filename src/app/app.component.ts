import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AnalyticsService } from './services/analytics.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Lojinha do Kaka';

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    // O Analytics será inicializado automaticamente pelo serviço
  }
}
