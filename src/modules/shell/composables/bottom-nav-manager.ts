/**
 * BottomNav 导航项目定义
 */
export interface NavItem {
  id: string;
  name: string;
  path: string;
  routeName: string;
}

/**
 * BottomNav 管理类
 * 负责导航项目的管理和路由跳转
 */
export class BottomNavManager {
  private items: NavItem[] = [];
  private currentActiveId: string = '';

  constructor(items?: NavItem[]) {
    if (items) {
      this.items = items;
      this.currentActiveId = items[0]?.id || '';
    }
  }

  /**
   * 初始化导航项目
   */
  public initializeItems(items: NavItem[]): void {
    this.items = items;
    if (items.length > 0 && !this.currentActiveId) {
      this.currentActiveId = items[0].id;
    }
  }

  /**
   * 获取所有导航项目
   */
  public getItems(): NavItem[] {
    return this.items;
  }

  /**
   * 根据ID获取导航项目
   */
  public getItemById(id: string): NavItem | undefined {
    return this.items.find(item => item.id === id);
  }

  /**
   * 设置当前活跃的导航项目
   */
  public setActiveItem(id: string): boolean {
    const item = this.getItemById(id);
    if (item) {
      this.currentActiveId = id;
      return true;
    }
    return false;
  }

  /**
   * 获取当前活跃项目的ID
   */
  public getActiveItemId(): string {
    return this.currentActiveId;
  }

  /**
   * 获取当前活跃项目
   */
  public getActiveItem(): NavItem | undefined {
    return this.getItemById(this.currentActiveId);
  }

  /**
   * 判断指定ID是否为活跃项目
   */
  public isActive(id: string): boolean {
    return this.currentActiveId === id;
  }

  /**
   * 根据路由名称获取项目
   */
  public getItemByRouteName(routeName: string): NavItem | undefined {
    return this.items.find(item => item.routeName === routeName);
  }

  /**
   * 添加导航项目（用于扩展性）
   */
  public addItem(item: NavItem): void {
    if (!this.items.find(i => i.id === item.id)) {
      this.items.push(item);
    }
  }

  /**
   * 删除导航项目（用于扩展性）
   */
  public removeItem(id: string): void {
    this.items = this.items.filter(item => item.id !== id);
    if (this.currentActiveId === id && this.items.length > 0) {
      this.currentActiveId = this.items[0].id;
    }
  }

  /**
   * 获取项目顺序
   */
  public getItemOrder(): string[] {
    return this.items.map(item => item.id);
  }

  /**
   * 重新排序导航项目
   */
  public reorderItems(order: string[]): boolean {
    const orderedItems = order
      .map(id => this.getItemById(id))
      .filter((item): item is NavItem => item !== undefined);

    if (orderedItems.length === this.items.length) {
      this.items = orderedItems;
      return true;
    }
    return false;
  }
}
