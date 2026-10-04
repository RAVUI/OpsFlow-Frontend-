import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ClaimService
} from '../../core/services/claim.service';

import {
  AuthService
} from '../../core/services/auth.service';

import {
  ClaimDashboard,
  DashboardClaim
} from '../../core/models/claim.models';

interface ChartDay {
  date: Date;
  label: string;
  raised: number;
  inProgress: number;
  review: number;
  closed: number;
}

type ChartType =
  | 'raised'
  | 'inProgress'
  | 'review'
  | 'closed';

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './dashboard.component.html',

  styleUrl:
    './dashboard.component.css'
})
export class DashboardComponent
  implements OnInit {

  dashboard:
    ClaimDashboard | null = null;

  loading = true;

  errorMessage = '';

  selectedPeriod = 7;

  chartDays: ChartDay[] = [];

  constructor(
    private claimService: ClaimService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {

    this.loading = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    this.claimService
      .getDashboard()
      .subscribe({

        next: data => {

          this.dashboard = data;

          this.buildChartData();

          this.loading = false;

          this.cdr.detectChanges();
        },

        error: error => {

          console.error(
            'Dashboard loading failed',
            error
          );

          this.dashboard = null;

          this.loading = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to load dashboard data.';

          this.cdr.detectChanges();
        }

      });
  }

  onPeriodChange(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    this.selectedPeriod =
      Number(select.value) || 7;

    this.buildChartData();

    this.cdr.detectChanges();
  }

  get user() {
    return this.authService.getUser();
  }

  get totalIssues(): number {
    return this.dashboard?.totalIssues ?? 0;
  }

  get raisedIssues(): number {
    return this.dashboard?.raisedIssues ?? 0;
  }

  get inProgressIssues(): number {
    return this.dashboard?.inProgressIssues ?? 0;
  }

  get reviewIssues(): number {
    return this.dashboard?.reviewIssues ?? 0;
  }

  get closedIssues(): number {
    return this.dashboard?.closedIssues ?? 0;
  }

  get todayIssues(): number {
    return this.dashboard?.todayIssues ?? 0;
  }

  get recentIssues(): DashboardClaim[] {
    return this.dashboard?.recentIssues ?? [];
  }

  /* =====================================================
     CHART
  ===================================================== */

  get chartMax(): number {

    if (!this.chartDays.length) {
      return 5;
    }

    const values =
      this.chartDays.flatMap(day => [
        day.raised,
        day.inProgress,
        day.review,
        day.closed
      ]);

    const max =
      Math.max(...values, 0);

    if (max <= 5) {
      return 5;
    }

    return Math.ceil(max / 5) * 5;
  }

  get yTicks(): number[] {

    const max =
      this.chartMax;

    return [
      max,
      Math.round(max * 0.75),
      Math.round(max * 0.5),
      Math.round(max * 0.25),
      0
    ];
  }

  getChartX(index: number): number {

    const left = 55;
    const right = 705;

    if (this.chartDays.length <= 1) {
      return left;
    }

    return (
      left +
      (
        index /
        (this.chartDays.length - 1)
      ) *
      (right - left)
    );
  }

  getChartY(value: number): number {

    const top = 20;
    const bottom = 205;
    const height = bottom - top;

    if (!this.chartMax) {
      return bottom;
    }

    return (
      bottom -
      (
        value /
        this.chartMax
      ) *
      height
    );
  }

  /*
   * Smooth cubic curve.
   *
   * Instead of:
   * polyline
   *
   * we create:
   * M + C + C + C...
   *
   * So the graph naturally bends between points.
   */
  getSmoothPath(
    type: ChartType
  ): string {

    if (!this.chartDays.length) {
      return '';
    }

    const points =
      this.chartDays.map(
        (day, index) => ({
          x: this.getChartX(index),
          y: this.getChartY(day[type])
        })
      );

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let path =
      `M ${points[0].x} ${points[0].y}`;

    for (
      let i = 0;
      i < points.length - 1;
      i++
    ) {

      const current =
        points[i];

      const next =
        points[i + 1];

      const previous =
        points[i - 1] || current;

      const following =
        points[i + 2] || next;

      const control1X =
        current.x +
        (next.x - previous.x) / 6;

      const control1Y =
        current.y +
        (next.y - previous.y) / 6;

      const control2X =
        next.x -
        (following.x - current.x) / 6;

      const control2Y =
        next.y -
        (following.y - current.y) / 6;

      path +=
        ` C ${control1X} ${control1Y},` +
        ` ${control2X} ${control2Y},` +
        ` ${next.x} ${next.y}`;
    }

    return path;
  }

  getAreaPath(
    type: ChartType
  ): string {

    if (!this.chartDays.length) {
      return '';
    }

    const linePath =
      this.getSmoothPath(type);

    const firstX =
      this.getChartX(0);

    const lastX =
      this.getChartX(
        this.chartDays.length - 1
      );

    const bottom = 205;

    return (
      `M ${firstX} ${bottom} ` +
      linePath.substring(
        linePath.indexOf('M') + 1
      ) +
      ` L ${lastX} ${bottom} Z`
    );
  }

  /* =====================================================
     DONUT
  ===================================================== */

  get donutStyle(): string {

    const total =
      this.totalIssues;

    if (total <= 0) {
      return `
        conic-gradient(
          #e9edf4 0deg 360deg
        )
      `;
    }

    const raised =
      (this.raisedIssues / total) * 360;

    const inProgress =
      (this.inProgressIssues / total) * 360;

    const review =
      (this.reviewIssues / total) * 360;

    const raisedEnd =
      raised;

    const progressEnd =
      raisedEnd + inProgress;

    const reviewEnd =
      progressEnd + review;

    return `
      conic-gradient(
        #3b82f6 0deg ${raisedEnd}deg,
        #f59e0b ${raisedEnd}deg ${progressEnd}deg,
        #8b5cf6 ${progressEnd}deg ${reviewEnd}deg,
        #22c55e ${reviewEnd}deg 360deg
      )
    `;
  }

  getPercentage(
    value: number
  ): number {

    if (!this.totalIssues) {
      return 0;
    }

    return Math.round(
      (value / this.totalIssues) * 100
    );
  }

  /* =====================================================
     STATUS
  ===================================================== */

  getStatusLabel(
    status: string
  ): string {

    switch (status) {

      case 'InProgress':
        return 'In Progress';

      case 'Closed':
        return 'Completed';

      case 'Review':
        return 'Review';

      case 'Raised':
        return 'Raised';

      default:
        return status;
    }
  }

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'Raised':
        return 'raised';

      case 'InProgress':
        return 'in-progress';

      case 'Review':
        return 'review';

      case 'Closed':
        return 'closed';

      default:
        return 'default';
    }
  }

  getAssignee(
    issue: DashboardClaim
  ): string {

    return issue.assignedEmployeeName ||
      'Unassigned';
  }

  trackByIssue(
    _index: number,
    issue: DashboardClaim
  ): number {

    return issue.id;
  }

  get dateRangeLabel(): string {

    if (!this.chartDays.length) {
      return 'No date range';
    }

    const first =
      this.chartDays[0].date;

    const last =
      this.chartDays[
        this.chartDays.length - 1
      ].date;

    return (
      `${this.formatDate(first)} - ` +
      `${this.formatDate(last)}`
    );
  }

  /* =====================================================
     BUILD CHART DATA
  ===================================================== */

  private buildChartData(): void {

    const issues =
      this.dashboard?.recentIssues ?? [];

    const days: ChartDay[] = [];

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    for (
      let index = this.selectedPeriod - 1;
      index >= 0;
      index--
    ) {

      const date =
        new Date(today);

      date.setDate(
        today.getDate() - index
      );

      const dateKey =
        this.getDateKey(date);

      const dayIssues =
        issues.filter(issue => {

          const issueDate =
            new Date(issue.createdAt);

          return (
            this.getDateKey(issueDate) ===
            dateKey
          );
        });

      days.push({

        date,

        label:
          this.formatShortDate(date),

        raised:
          dayIssues.filter(
            x => x.status === 'Raised'
          ).length,

        inProgress:
          dayIssues.filter(
            x => x.status === 'InProgress'
          ).length,

        review:
          dayIssues.filter(
            x => x.status === 'Review'
          ).length,

        closed:
          dayIssues.filter(
            x => x.status === 'Closed'
          ).length

      });
    }

    this.chartDays = days;
  }

  private getDateKey(
    date: Date
  ): string {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatShortDate(
    date: Date
  ): string {

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    );
  }

  private formatDate(
    date: Date
  ): string {

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );
  }
}